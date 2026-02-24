import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { issues, settings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { measurePenetrationRate } from "@/lib/ai/penetration";
import { estimateReadingTime } from "@/lib/utils";

function markdownFromHtml(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "$1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "$1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const issue = await db.query.issues.findFirst({
    where: and(eq(issues.id, id), eq(issues.creatorId, session.creatorId!)),
  });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update content before publishing
  const { title, subtitle, coverImage, content, summary, keyPoints, topics, authorNote, humanWritten, targetChannels } = body;
  const fullMarkdown = content ? markdownFromHtml(content) : issue.fullMarkdown;
  const readingTime = fullMarkdown ? estimateReadingTime(fullMarkdown) : issue.readingTimeMinutes;

  // Get API key for penetration measurement
  const creatorSettings = await db.query.settings.findFirst({
    where: eq(settings.creatorId, session.creatorId!),
  });
  const anthropicKey = creatorSettings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  // Measure content penetration rate
  let penetrationResult = null;
  const finalKeyPoints = keyPoints ?? issue.keyPoints ?? [];
  if (finalKeyPoints.length > 0 && fullMarkdown) {
    penetrationResult = await measurePenetrationRate(
      fullMarkdown,
      finalKeyPoints,
      anthropicKey || undefined
    );
  }

  const [updated] = await db
    .update(issues)
    .set({
      title: title ?? issue.title,
      subtitle: subtitle !== undefined ? (subtitle || null) : issue.subtitle,
      coverImage: coverImage !== undefined ? (coverImage || null) : issue.coverImage,
      fullHtml: content ?? issue.fullHtml,
      fullMarkdown: fullMarkdown ?? issue.fullMarkdown,
      summary: summary ?? issue.summary,
      keyPoints: finalKeyPoints,
      topics: topics ?? issue.topics,
      authorNote: authorNote ?? issue.authorNote,
      humanWritten: humanWritten ?? issue.humanWritten,
      ...(targetChannels !== undefined && { targetChannels }),
      readingTimeMinutes: readingTime,
      status: "published",
      publishedAt: new Date(),
      contentPenetrationScore: penetrationResult?.score ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(issues.id, id), eq(issues.creatorId, session.creatorId!)))
    .returning();

  return NextResponse.json({
    issue: updated,
    penetration: penetrationResult,
  });
}
