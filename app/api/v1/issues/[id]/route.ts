import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { detectBot } from "@/lib/analytics/bot-detector";
import { trackEvent } from "@/lib/analytics/events";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0];

  const issue = await db.query.issues.findFirst({
    where: and(eq(issues.id, id), eq(issues.status, "published")),
  });

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Track as agent_query if bot, or api access
  const { isBot } = detectBot(ua ?? null, { ip });
  await trackEvent({
    issueId: id,
    eventType: isBot ? "open" : "agent_query",
    userAgent: ua,
    ip,
  });

  return NextResponse.json(
    {
      id: issue.id,
      title: issue.title,
      summary: issue.summary,
      key_points: issue.keyPoints,
      topics: issue.topics,
      author_note: issue.authorNote,
      human_written: issue.humanWritten,
      full_content_markdown: issue.fullMarkdown,
      full_content_html: issue.fullHtml,
      reading_time_minutes: issue.readingTimeMinutes,
      published_at: issue.publishedAt?.toISOString(),
      content_penetration_score: issue.contentPenetrationScore,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
