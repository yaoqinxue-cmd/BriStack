import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, creators } from "@/lib/db/schema";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const slug = searchParams.get("slug") || process.env.CREATOR_SLUG || "newsletter";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query too short (min 2 chars)" }, { status: 400 });
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.slug, slug),
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const results = await db.query.issues.findMany({
    where: and(
      eq(issues.creatorId, creator.id),
      eq(issues.status, "published"),
      or(
        ilike(issues.title, `%${query}%`),
        ilike(issues.summary, `%${query}%`),
        ilike(issues.fullMarkdown, `%${query}%`)
      )
    ),
    orderBy: [desc(issues.publishedAt)],
    limit,
    columns: {
      id: true,
      title: true,
      summary: true,
      keyPoints: true,
      topics: true,
      readingTimeMinutes: true,
      publishedAt: true,
    },
  });

  return NextResponse.json(
    {
      query,
      total: results.length,
      results: results.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        key_points: r.keyPoints,
        topics: r.topics,
        reading_time_minutes: r.readingTimeMinutes,
        published_at: r.publishedAt?.toISOString(),
      })),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
