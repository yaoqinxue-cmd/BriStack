import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSummary, extractKeyPoints } from "@/lib/ai/summarize";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  // Get API key
  const creatorSettings = await db.query.settings.findFirst({
    where: eq(settings.creatorId, session.creatorId!),
  });
  const apiKey = creatorSettings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "未配置 Anthropic API Key，请在设置页面配置" },
      { status: 400 }
    );
  }

  // Strip HTML for plain text
  const plainText = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const [summary, keyPoints] = await Promise.all([
    generateSummary(plainText, title, apiKey),
    extractKeyPoints(plainText, title, apiKey),
  ]);

  return NextResponse.json({ summary, keyPoints });
}
