import { db } from "@/lib/db";
import { analyticsEvents, subscribers } from "@/lib/db/schema";
import { detectBot } from "./bot-detector";
import { hashIp } from "@/lib/utils";
import { eq, and, sql } from "drizzle-orm";

type EventType =
  | "open"
  | "scroll"
  | "click"
  | "reply"
  | "agent_query"
  | "mcp_query"
  | "subscribe"
  | "unsubscribe";

interface TrackEventOptions {
  issueId?: string;
  subscriberId?: string;
  eventType: EventType;
  userAgent?: string | null;
  ip?: string;
  scrollDepth?: number;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(options: TrackEventOptions) {
  const { isBot, botType, confidence } = detectBot(options.userAgent ?? null, {
    ip: options.ip,
  });

  const ipHash = options.ip ? hashIp(options.ip) : null;

  await db.insert(analyticsEvents).values({
    issueId: options.issueId ?? null,
    subscriberId: options.subscriberId ?? null,
    eventType: options.eventType,
    isBot,
    botType: botType ?? undefined,
    uaString: options.userAgent ?? undefined,
    scrollDepth: options.scrollDepth,
    ipHash: ipHash ?? undefined,
    metadata: options.metadata ?? {},
  });

  // Update subscriber level if it's a human completing an article (scroll to ~90%)
  if (
    !isBot &&
    options.subscriberId &&
    options.eventType === "scroll" &&
    options.scrollDepth &&
    options.scrollDepth >= 90
  ) {
    await maybeUpgradeSubscriberLevel(options.subscriberId);
  }

  // Update last activity
  if (!isBot && options.subscriberId) {
    await db
      .update(subscribers)
      .set({ lastActivityAt: new Date() })
      .where(eq(subscribers.id, options.subscriberId));
  }

  return { isBot, botType, confidence };
}

async function maybeUpgradeSubscriberLevel(subscriberId: string) {
  // Count how many issues this subscriber has fully read
  const readCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.subscriberId, subscriberId),
        eq(analyticsEvents.eventType, "scroll"),
        eq(analyticsEvents.isBot, false),
        sql`${analyticsEvents.scrollDepth} >= 90`
      )
    );

  const count = Number(readCount[0]?.count || 0);

  // Upgrade to Level 2 after reading 3+ articles
  if (count >= 3) {
    await db
      .update(subscribers)
      .set({
        level: sql`GREATEST(${subscribers.level}, 2)`,
        humanVerifiedAt: sql`COALESCE(${subscribers.humanVerifiedAt}, NOW())`,
      })
      .where(
        and(eq(subscribers.id, subscriberId), sql`${subscribers.level} < 2`)
      );
  }
}

export async function recordAgentQuery(
  subscriberId: string,
  issueId?: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(analyticsEvents).values({
    subscriberId,
    issueId: issueId ?? null,
    eventType: "agent_query",
    isBot: false, // Agent queries are intentional, not "bots" in our context
    metadata: metadata ?? {},
  });

  await db
    .update(subscribers)
    .set({ lastActivityAt: new Date() })
    .where(eq(subscribers.id, subscriberId));
}

export async function recordMcpQuery(
  subscriberId: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(analyticsEvents).values({
    subscriberId,
    eventType: "mcp_query",
    isBot: false,
    metadata: metadata ?? {},
  });

  await db
    .update(subscribers)
    .set({ lastActivityAt: new Date() })
    .where(eq(subscribers.id, subscriberId));
}
