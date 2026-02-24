import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { issues, subscribers, deliveries, creators } from "@/lib/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/sender";
import { render } from "@react-email/components";
import { IssueEmail } from "@/lib/email/templates/IssueEmail";
import { generateUnsubscribeToken } from "@/lib/utils";
import React from "react";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { filterLevel = "all", filterTags = [], previewEmail } = body as {
    filterLevel?: number | "all";
    filterTags?: string[];
    previewEmail?: string;
  };

  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, id),
      eq(issues.creatorId, session.creatorId!),
      eq(issues.status, "published")
    ),
  });

  if (!issue) {
    return NextResponse.json({ error: "内容不存在或未发布" }, { status: 404 });
  }

  // Check if email channel is enabled for this issue
  const tc = issue.targetChannels || [];
  if (tc.length > 0 && !tc.includes("email")) {
    return NextResponse.json({ error: "此内容未开放邮件渠道，无法发送邮件" }, { status: 400 });
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, session.creatorId!),
    columns: { name: true, fromEmail: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  // Preview send
  if (previewEmail) {
    const html = await buildEmailHtml(issue, creator?.name || "Space", appUrl, "preview", "preview");
    const result = await sendEmail(session.creatorId!, {
      to: previewEmail,
      subject: `[预览] ${issue.title}`,
      html,
    });
    return NextResponse.json({ preview: true, success: result.success, error: result.error });
  }

  // Get subscribers who haven't received this issue yet
  const alreadySentSubIds = await db
    .select({ subscriberId: deliveries.subscriberId })
    .from(deliveries)
    .where(and(eq(deliveries.issueId, id), eq(deliveries.channel, "email")));

  const excludeIds = alreadySentSubIds.map((d) => d.subscriberId);

  const conditions: any[] = [
    eq(subscribers.creatorId, session.creatorId!),
    eq(subscribers.type, "human"),
    eq(subscribers.status, "active"),
    excludeIds.length > 0 ? notInArray(subscribers.id, excludeIds) : sql`true`,
  ];

  if (filterLevel !== "all" && typeof filterLevel === "number") {
    conditions.push(eq(subscribers.level, filterLevel));
  }

  const humanSubs = await db.query.subscribers.findMany({
    where: and(...conditions),
    columns: { id: true, email: true, name: true, tags: true },
  });

  // Filter by tags
  const filteredSubs = filterTags.length > 0
    ? humanSubs.filter((s) => filterTags.some((t) => (s.tags || []).includes(t)))
    : humanSubs;

  let sent = 0, failed = 0, skipped = 0;

  for (let i = 0; i < filteredSubs.length; i += BATCH_SIZE) {
    const batch = filteredSubs.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (sub) => {
        if (!sub.email) { skipped++; return; }

        const unsubscribeToken = generateUnsubscribeToken(sub.id);
        const unsubscribeUrl = `${appUrl}/unsubscribe?id=${sub.id}&token=${unsubscribeToken}`;
        const html = await buildEmailHtml(issue, creator?.name || "Space", appUrl, id, sub.id, unsubscribeUrl);

        const [delivery] = await db
          .insert(deliveries)
          .values({ issueId: id, subscriberId: sub.id, channel: "email", status: "queued" })
          .returning();

        const result = await sendEmail(session.creatorId!, {
          to: sub.email,
          toName: sub.name || undefined,
          subject: issue.title,
          html,
          unsubscribeUrl,
        });

        await db.update(deliveries).set({
          status: result.success ? "sent" : "failed",
          sentAt: result.success ? new Date() : undefined,
          emailMessageId: result.messageId,
          errorMessage: result.error,
        }).where(eq(deliveries.id, delivery.id));

        result.success ? sent++ : failed++;
      })
    );

    if (i + BATCH_SIZE < filteredSubs.length) await sleep(BATCH_DELAY_MS);
  }

  return NextResponse.json({ sent, failed, skipped, total: filteredSubs.length });
}

async function buildEmailHtml(
  issue: {
    title: string; subtitle?: string | null; summary?: string | null;
    fullHtml?: string | null; authorNote?: string | null;
    topics?: string[] | null; readingTimeMinutes?: number | null;
    publishedAt?: Date | null;
  },
  creatorName: string,
  appUrl: string,
  issueId: string,
  subscriberId: string,
  unsubscribeUrl?: string
) {
  const trackingPixelUrl = `${appUrl}/api/track?i=${issueId}&s=${subscriberId}`;
  return render(
    React.createElement(IssueEmail, {
      creatorName,
      issueTitle: issue.title,
      issueSummary: issue.summary || undefined,
      issueHtml: issue.fullHtml || "",
      authorNote: issue.authorNote || undefined,
      topics: issue.topics || [],
      readingTimeMinutes: issue.readingTimeMinutes || undefined,
      publishedAt: issue.publishedAt || new Date(),
      unsubscribeUrl: unsubscribeUrl || "#",
      trackingPixelUrl,
      replyToEmail: "",
    })
  );
}
