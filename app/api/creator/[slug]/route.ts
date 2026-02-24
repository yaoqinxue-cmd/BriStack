import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creators, issues, subscribers, settings } from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const creator = await db.query.creators.findFirst({
    where: eq(creators.slug, slug),
  });

  if (!creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Gather public stats
  const [subCountResult, issueCountResult] = await Promise.all([
    db.select({ count: count() }).from(subscribers).where(
      and(eq(subscribers.creatorId, creator.id), eq(subscribers.status, "active"), eq(subscribers.type, "human"))
    ),
    db.select({ count: count() }).from(issues).where(
      and(eq(issues.creatorId, creator.id), eq(issues.status, "published"))
    ),
  ]);

  // Recent published issues visible on landing page
  // targetChannels = [] means all channels; otherwise must include 'landing_page'
  const recentIssues = await db.query.issues.findMany({
    where: and(
      eq(issues.creatorId, creator.id),
      eq(issues.status, "published"),
      sql`(array_length(${issues.targetChannels}, 1) IS NULL OR 'landing_page' = ANY(${issues.targetChannels}))`
    ),
    orderBy: [desc(issues.publishedAt)],
    limit: 6,
    columns: {
      id: true, title: true, subtitle: true, summary: true,
      topics: true, readingTimeMinutes: true, publishedAt: true,
      coverImage: true,
    },
  });

  // Get settings for MCP info
  const creatorSettings = await db.query.settings.findFirst({
    where: eq(settings.creatorId, creator.id),
    columns: { emailProvider: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return NextResponse.json({
    id: creator.id,
    name: creator.name,
    slug: creator.slug,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl,
    subscriberCount: Number(subCountResult[0]?.count || 0),
    issueCount: Number(issueCountResult[0]?.count || 0),
    recentIssues,
    mcpUrl: `${appUrl}/api/mcp`,
    apiUrl: `${appUrl}/api/v1`,
  });
}
