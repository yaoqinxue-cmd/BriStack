import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers, creators, settings } from "@/lib/db/schema";
import { eq, and, isNull, lte, gte, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/sender";
import { render } from "@react-email/components";
import { GreetingEmail } from "@/lib/email/templates/GreetingEmail";
import { generateUnsubscribeToken } from "@/lib/utils";
import React from "react";

// This endpoint should be called daily by a cron service.
// Vercel: add to vercel.json: { "crons": [{ "path": "/api/cron/greetings", "schedule": "0 9 * * *" }] }
// Protect with CRON_SECRET env var.

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const now = new Date();

  // Get all creators with greeting enabled
  const allSettings = await db.query.settings.findMany({
    where: and(
      eq(settings.greetingEmailEnabled, true),
      sql`${settings.greetingEmailSubject} is not null`,
      sql`${settings.greetingEmailBody} is not null`,
    ),
  });

  let totalSent = 0;
  let totalFailed = 0;

  for (const setting of allSettings) {
    const delayDays = setting.greetingDelayDays ?? 3;

    // Calculate the window: subscribers who signed up exactly `delayDays` days ago (±12h window)
    const windowEnd = new Date(now.getTime() - delayDays * 24 * 60 * 60 * 1000);
    const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000);

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, setting.creatorId),
      columns: { id: true, name: true },
    });
    if (!creator) continue;

    // Find eligible subscribers
    const eligible = await db.query.subscribers.findMany({
      where: and(
        eq(subscribers.creatorId, setting.creatorId),
        eq(subscribers.type, "human"),
        eq(subscribers.status, "active"),
        eq(subscribers.isBot, false),
        isNull(subscribers.greetingSentAt),
        lte(subscribers.subscribedAt, windowEnd),
        gte(subscribers.subscribedAt, windowStart),
      ),
      columns: { id: true, email: true, name: true },
    });

    for (const sub of eligible) {
      if (!sub.email) continue;

      // Resolve template variables
      const resolvedBody = (setting.greetingEmailBody || "")
        .replace(/{name}/g, sub.name || "读者")
        .replace(/{creatorName}/g, creator.name);
      const resolvedSubject = (setting.greetingEmailSubject || "")
        .replace(/{name}/g, sub.name || "读者")
        .replace(/{creatorName}/g, creator.name);

      const unsubscribeToken = generateUnsubscribeToken(sub.id);
      const unsubscribeUrl = `${appUrl}/unsubscribe?id=${sub.id}&token=${unsubscribeToken}`;

      const html = await render(
        React.createElement(GreetingEmail, {
          creatorName: creator.name,
          subscriberName: sub.name || undefined,
          subject: resolvedSubject,
          body: resolvedBody,
          unsubscribeUrl,
        })
      );

      const result = await sendEmail(creator.id, {
        to: sub.email,
        toName: sub.name || undefined,
        subject: resolvedSubject,
        html,
        unsubscribeUrl,
      });

      if (result.success) {
        await db
          .update(subscribers)
          .set({ greetingSentAt: now, updatedAt: now })
          .where(eq(subscribers.id, sub.id));
        totalSent++;
      } else {
        totalFailed++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, failed: totalFailed, processedAt: now.toISOString() });
}
