import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { estimateReadingTime } from "@/lib/utils";

function markdownFromHtml(html: string): string {
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const issue = await db.query.issues.findFirst({
    where: and(eq(issues.id, id), eq(issues.creatorId, session.creatorId!)),
  });

  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(issue);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, subtitle, coverImage, content, summary, keyPoints, topics, authorNote, humanWritten, status, targetChannels } = body;

  const fullMarkdown = content ? markdownFromHtml(content) : undefined;
  const readingTime = fullMarkdown ? estimateReadingTime(fullMarkdown) : undefined;

  const [updated] = await db
    .update(issues)
    .set({
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle: subtitle || null }),
      ...(coverImage !== undefined && { coverImage: coverImage || null }),
      ...(content !== undefined && { fullHtml: content }),
      ...(fullMarkdown !== undefined && { fullMarkdown }),
      ...(summary !== undefined && { summary }),
      ...(keyPoints !== undefined && { keyPoints }),
      ...(topics !== undefined && { topics }),
      ...(authorNote !== undefined && { authorNote }),
      ...(humanWritten !== undefined && { humanWritten }),
      ...(readingTime !== undefined && { readingTimeMinutes: readingTime }),
      ...(status !== undefined && { status }),
      ...(targetChannels !== undefined && { targetChannels }),
      updatedAt: new Date(),
    })
    .where(and(eq(issues.id, id), eq(issues.creatorId, session.creatorId!)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(issues)
    .where(and(eq(issues.id, id), eq(issues.creatorId, session.creatorId!)));

  return NextResponse.json({ ok: true });
}
