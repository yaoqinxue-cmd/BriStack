import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { estimateReadingTime } from "@/lib/utils";

// content is already HTML from Tiptap - pass through directly
function htmlFromContent(content: string): string {
  return content;
}

function markdownFromHtml(html: string): string {
  // Very basic HTML to markdown - in production use turndown
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const issueList = await db.query.issues.findMany({
    where: eq(issues.creatorId, session.creatorId!),
    orderBy: [desc(issues.createdAt)],
  });

  return NextResponse.json(issueList);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content, summary, keyPoints, topics, authorNote, humanWritten, status, targetChannels } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const fullMarkdown = markdownFromHtml(content || "");
  const readingTime = estimateReadingTime(fullMarkdown);

  const [issue] = await db
    .insert(issues)
    .values({
      creatorId: session.creatorId!,
      title: title.trim(),
      fullHtml: content,
      fullMarkdown,
      summary: summary || null,
      keyPoints: keyPoints || [],
      topics: topics || [],
      authorNote: authorNote || null,
      humanWritten: humanWritten !== false,
      readingTimeMinutes: readingTime,
      status: status || "draft",
      targetChannels: targetChannels || [],
      publishedAt: status === "published" ? new Date() : undefined,
    })
    .returning();

  return NextResponse.json(issue);
}
