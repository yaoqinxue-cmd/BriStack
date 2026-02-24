import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [total, humanSubs, agentSubs, mcpSubs] = await Promise.all([
    db.select({ count: count() }).from(subscribers).where(
      and(eq(subscribers.creatorId, session.creatorId!), eq(subscribers.status, "active"))
    ),
    db.select({ count: count() }).from(subscribers).where(
      and(eq(subscribers.creatorId, session.creatorId!), eq(subscribers.type, "human"), eq(subscribers.status, "active"))
    ),
    db.select({ count: count() }).from(subscribers).where(
      and(eq(subscribers.creatorId, session.creatorId!), eq(subscribers.type, "agent"), eq(subscribers.status, "active"))
    ),
    db.select({ count: count() }).from(subscribers).where(
      and(eq(subscribers.creatorId, session.creatorId!), eq(subscribers.type, "mcp"), eq(subscribers.status, "active"))
    ),
  ]);

  // Collect all unique tags from human subscribers
  const humanSubsWithTags = await db.query.subscribers.findMany({
    where: and(eq(subscribers.creatorId, session.creatorId!), eq(subscribers.type, "human"), eq(subscribers.status, "active")),
    columns: { tags: true },
  });
  const tagSet = new Set<string>();
  for (const s of humanSubsWithTags) {
    for (const tag of s.tags || []) tagSet.add(tag);
  }

  return NextResponse.json({
    total: Number(total[0]?.count || 0),
    humanSubscribers: Number(humanSubs[0]?.count || 0),
    agentSubscribers: Number(agentSubs[0]?.count || 0),
    mcpSubscribers: Number(mcpSubs[0]?.count || 0),
    tags: Array.from(tagSet).sort(),
  });
  } catch (err) {
    console.error("stats error:", err);
    return NextResponse.json({ total: 0, humanSubscribers: 0, agentSubscribers: 0, mcpSubscribers: 0, tags: [] });
  }
}
