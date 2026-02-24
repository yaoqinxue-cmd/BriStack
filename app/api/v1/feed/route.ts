import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, creators } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// JSON Feed v1.1 format (RSS++ compatible)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || process.env.CREATOR_SLUG || "newsletter";

  const creator = await db.query.creators.findFirst({
    where: eq(creators.slug, slug),
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const issueList = await db.query.issues.findMany({
    where: and(
      eq(issues.creatorId, creator.id),
      eq(issues.status, "published"),
      sql`(array_length(${issues.targetChannels}, 1) IS NULL OR 'landing_page' = ANY(${issues.targetChannels}))`
    ),
    orderBy: [desc(issues.publishedAt)],
    limit: 20,
    columns: {
      id: true,
      title: true,
      summary: true,
      keyPoints: true,
      topics: true,
      fullMarkdown: true,
      fullHtml: true,
      authorNote: true,
      humanWritten: true,
      readingTimeMinutes: true,
      publishedAt: true,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: creator.name,
    description: creator.bio,
    home_page_url: `${appUrl}/subscribe/${slug}`,
    feed_url: `${appUrl}/api/v1/feed?slug=${slug}`,
    // Extensions for AI consumption
    _bristack: {
      creator_slug: slug,
      mcp_url: `${appUrl}/api/mcp`,
      api_url: `${appUrl}/api/v1`,
      subscribe_url: `${appUrl}/subscribe/${slug}`,
    },
    items: issueList.map((issue) => ({
      id: issue.id,
      url: `${appUrl}/api/v1/issues/${issue.id}`,
      title: issue.title,
      summary: issue.summary,
      content_html: issue.fullHtml,
      content_text: issue.fullMarkdown,
      date_published: issue.publishedAt?.toISOString(),
      tags: issue.topics || [],
      // AI-friendly extensions
      _ai: {
        key_points: issue.keyPoints || [],
        author_note: issue.authorNote,
        human_written: issue.humanWritten,
        reading_time_minutes: issue.readingTimeMinutes,
      },
    })),
  };

  return NextResponse.json(feed, {
    headers: {
      "Content-Type": "application/feed+json",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
