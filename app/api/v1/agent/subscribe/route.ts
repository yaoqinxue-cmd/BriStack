import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers, apiKeys, creators } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateApiKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    agent_id,
    agent_type,
    owner_topics,
    preferred_format,
    query_frequency,
    rate_limit_tier,
    creator_slug,
  } = body;

  if (!agent_id) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  const slug = creator_slug || process.env.CREATOR_SLUG || "newsletter";
  const creator = await db.query.creators.findFirst({
    where: eq(creators.slug, slug),
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // Check if already subscribed
  const existing = await db.query.subscribers.findFirst({
    where: and(
      eq(subscribers.creatorId, creator.id),
      eq(subscribers.agentId, agent_id)
    ),
  });

  if (existing && existing.status === "active") {
    // Return existing API key info (without the actual key)
    const existingKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.subscriberId, existing.id),
    });
    return NextResponse.json({
      ok: true,
      already_subscribed: true,
      subscriber_id: existing.id,
      key_prefix: existingKey?.keyPrefix,
    });
  }

  // Create agent subscriber
  const [newSubscriber] = await db
    .insert(subscribers)
    .values({
      creatorId: creator.id,
      type: "agent",
      agentId: agent_id,
      agentType: agent_type || "personal_assistant",
      topicsInterest: owner_topics || [],
      preferredFormat: preferred_format || "json",
      queryFrequency: query_frequency || "on_demand",
      rateLimitTier: rate_limit_tier || "free",
      level: 1,
    })
    .returning();

  // Generate API key
  const { key, prefix, hash } = generateApiKey();
  await db.insert(apiKeys).values({
    subscriberId: newSubscriber.id,
    keyPrefix: prefix,
    keyHash: hash,
  });

  return NextResponse.json({
    ok: true,
    subscriber_id: newSubscriber.id,
    api_key: key, // Only shown once on creation
    key_prefix: prefix,
    endpoints: {
      feed: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/feed`,
      search: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/search`,
      mcp: `${process.env.NEXT_PUBLIC_APP_URL}/api/mcp`,
    },
    usage: {
      authentication: "Include 'Authorization: Bearer <api_key>' header",
      rate_limit: rate_limit_tier || "free",
    },
  });
}
