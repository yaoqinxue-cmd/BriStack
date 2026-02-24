import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers, creators, settings, websites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { detectBot } from "@/lib/analytics/bot-detector";
import { trackEvent } from "@/lib/analytics/events";
import { generateUnsubscribeToken } from "@/lib/utils";
import { sendEmail } from "@/lib/email/sender";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/lib/email/templates/WelcomeEmail";
import React from "react";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, creatorSlug, embedKey } = body;

  if (!email || (!creatorSlug && !embedKey)) {
    return NextResponse.json({ error: "Email and creator slug required" }, { status: 400 });
  }

  // Resolve creator - either by slug or by embedKey (from external widget)
  let creator;
  let sourceWebsiteId: string | null = null;

  if (embedKey) {
    const site = await db.query.websites.findFirst({
      where: eq(websites.embedKey, embedKey),
    });
    if (!site) return NextResponse.json({ error: "Invalid embed key" }, { status: 404 });
    sourceWebsiteId = site.id;
    creator = await db.query.creators.findFirst({
      where: eq(creators.id, site.creatorId),
    });
  } else {
    creator = await db.query.creators.findFirst({
      where: eq(creators.slug, creatorSlug),
    });
  }

  if (!creator) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  // Bot detection
  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { isBot, botType, confidence } = detectBot(ua, { ip });

  // Check if already subscribed
  const existing = await db.query.subscribers.findFirst({
    where: and(
      eq(subscribers.creatorId, creator.id),
      eq(subscribers.email, email.toLowerCase())
    ),
  });

  if (existing) {
    if (existing.status === "unsubscribed") {
      // Re-subscribe
      await db
        .update(subscribers)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(subscribers.id, existing.id));
      return NextResponse.json({ ok: true, resubscribed: true });
    }
    return NextResponse.json({ ok: true, alreadySubscribed: true });
  }

  // Create subscriber
  const [newSubscriber] = await db
    .insert(subscribers)
    .values({
      creatorId: creator.id,
      type: "human",
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      isBot,
      botConfidence: confidence,
      level: 1,
      sourceWebsiteId: sourceWebsiteId || undefined,
    })
    .returning();

  // Track subscribe event
  await trackEvent({
    subscriberId: newSubscriber.id,
    eventType: "subscribe",
    userAgent: ua,
    ip,
  });

  // Send welcome email (async, don't block response)
  if (!isBot) {
    sendWelcomeEmail(creator, newSubscriber, email, sourceWebsiteId).catch(console.error);
  }

  return NextResponse.json({ ok: true, subscriberId: newSubscriber.id });
}

async function sendWelcomeEmail(
  creator: { id: number; name: string; slug: string; fromEmail: string | null },
  subscriber: { id: string; name: string | null },
  email: string,
  sourceWebsiteId: string | null = null
) {
  const [creatorSettings, sourceWebsite] = await Promise.all([
    db.query.settings.findFirst({ where: eq(settings.creatorId, creator.id) }),
    sourceWebsiteId
      ? db.query.websites.findFirst({ where: eq(websites.id, sourceWebsiteId) })
      : Promise.resolve(null),
  ]);

  // Global welcome email must be enabled
  const welcomeEnabled = creatorSettings?.welcomeEmailEnabled !== false;
  if (!welcomeEnabled) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const unsubscribeToken = generateUnsubscribeToken(subscriber.id);
  const unsubscribeUrl = `${appUrl}/unsubscribe?id=${subscriber.id}&token=${unsubscribeToken}`;

  const mcpInstallCode = `{
  "mcpServers": {
    "${creator.slug}": {
      "url": "${appUrl}/api/mcp",
      "headers": {
        "X-Creator-Slug": "${creator.slug}"
      }
    }
  }
}`;

  // Per-website override takes priority if enabled
  const useWebsiteOverride = sourceWebsite?.welcomeEmailEnabled === true;
  const customSubject = useWebsiteOverride
    ? (sourceWebsite?.welcomeEmailSubject || creatorSettings?.welcomeEmailSubject)
    : creatorSettings?.welcomeEmailSubject;
  const customBody = useWebsiteOverride
    ? (sourceWebsite?.welcomeEmailBody || creatorSettings?.welcomeEmailBody)
    : creatorSettings?.welcomeEmailBody;

  const resolvedSubject = customSubject
    ? customSubject
        .replace(/\{name\}/g, subscriber.name || email)
        .replace(/\{creatorName\}/g, creator.name)
    : `欢迎订阅 ${creator.name}`;

  const html = await render(
    React.createElement(WelcomeEmail, {
      creatorName: creator.name,
      subscriberName: subscriber.name || undefined,
      subscriberEmail: email,
      unsubscribeUrl,
      appUrl,
      creatorSlug: creator.slug,
      mcpInstallCode,
      customBody: customBody || undefined,
    })
  );

  await sendEmail(creator.id, {
    to: email,
    subject: resolvedSubject,
    html,
    unsubscribeUrl,
  });
}
