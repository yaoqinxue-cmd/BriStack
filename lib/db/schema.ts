import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  real,
  uuid,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const issueStatusEnum = pgEnum("issue_status", ["draft", "published"]);
export const subscriberTypeEnum = pgEnum("subscriber_type", [
  "human",
  "agent",
  "mcp",
]);
export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "active",
  "unsubscribed",
]);
export const deliveryChannelEnum = pgEnum("delivery_channel", [
  "email",
  "api",
  "mcp",
]);
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "queued",
  "sent",
  "failed",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "open",
  "scroll",
  "click",
  "reply",
  "agent_query",
  "mcp_query",
  "subscribe",
  "unsubscribe",
]);

// Creators table - the newsletter owner
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  email: text("email").notNull(),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUser: text("smtp_user"),
  smtpPassEncrypted: text("smtp_pass_encrypted"),
  fromName: text("from_name"),
  fromEmail: text("from_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Issues table - newsletter content
export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: integer("creator_id")
      .references(() => creators.id)
      .notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    coverImage: text("cover_image"),
    summary: text("summary"), // AI-optimized summary for Agent consumption
    keyPoints: jsonb("key_points").$type<string[]>().default([]),
    topics: text("topics").array().default([]),
    fullMarkdown: text("full_markdown"),
    fullHtml: text("full_html"),
    authorNote: text("author_note"), // Human touch - not AI replaceable
    humanWritten: boolean("human_written").default(true),
    humanWrittenPercentage: integer("human_written_percentage").default(100),
    readingTimeMinutes: integer("reading_time_minutes"),
    contentPenetrationScore: real("content_penetration_score"), // 0-100
    summarizabilityScore: real("summarizability_score"), // 0-100
    status: issueStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at"),
    targetChannels: text("target_channels").array().default([]),
    // pgvector embedding - requires vector extension
    // embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("issues_creator_id_idx").on(table.creatorId),
    index("issues_status_idx").on(table.status),
    index("issues_published_at_idx").on(table.publishedAt),
  ]
);

// Subscribers table - all three types
export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: integer("creator_id")
      .references(() => creators.id)
      .notNull(),
    type: subscriberTypeEnum("type").default("human").notNull(),
    // Human subscriber fields
    email: text("email"),
    name: text("name"),
    // Agent subscriber fields
    agentId: text("agent_id"),
    agentType: text("agent_type"), // personal_assistant | enterprise_research | product_integration
    // Common fields
    level: integer("level").default(1).notNull(), // 1-4 for humans; 1 for agents
    preferredFormat: text("preferred_format").default("html"), // html | markdown | json | summary_only
    queryFrequency: text("query_frequency"), // on_demand | daily_digest | weekly_digest
    rateLimitTier: text("rate_limit_tier").default("free"), // free | standard | enterprise
    status: subscriberStatusEnum("status").default("active").notNull(),
    topicsInterest: text("topics_interest").array().default([]),
    tags: text("tags").array().default([]),   // Creator-assigned labels e.g. ["vip","reader"]
    notes: text("notes"),                     // Creator's private notes on this subscriber
    isBot: boolean("is_bot").default(false),
    botConfidence: real("bot_confidence").default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    sourceWebsiteId: uuid("source_website_id"), // which embed widget they came from
    greetingSentAt: timestamp("greeting_sent_at"), // for delayed greeting emails
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
    humanVerifiedAt: timestamp("human_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscribers_creator_id_idx").on(table.creatorId),
    index("subscribers_email_idx").on(table.email),
    index("subscribers_type_idx").on(table.type),
    index("subscribers_status_idx").on(table.status),
    index("subscribers_level_idx").on(table.level),
  ]
);

// API Keys for Agent subscribers
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .references(() => subscribers.id)
      .notNull(),
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for display
    keyHash: text("key_hash").notNull().unique(), // SHA-256 hash
    lastUsedAt: timestamp("last_used_at"),
    totalCalls: integer("total_calls").default(0).notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_subscriber_id_idx").on(table.subscriberId),
    index("api_keys_key_hash_idx").on(table.keyHash),
  ]
);

// Deliveries table - tracking of sent content
export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .references(() => issues.id)
      .notNull(),
    subscriberId: uuid("subscriber_id")
      .references(() => subscribers.id)
      .notNull(),
    channel: deliveryChannelEnum("channel").notNull(),
    status: deliveryStatusEnum("status").default("queued").notNull(),
    emailMessageId: text("email_message_id"),
    sentAt: timestamp("sent_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("deliveries_issue_id_idx").on(table.issueId),
    index("deliveries_subscriber_id_idx").on(table.subscriberId),
    index("deliveries_status_idx").on(table.status),
  ]
);

// Analytics events - raw events with bot flag
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").references(() => issues.id),
    subscriberId: uuid("subscriber_id").references(() => subscribers.id),
    eventType: eventTypeEnum("event_type").notNull(),
    isBot: boolean("is_bot").default(false).notNull(),
    botType: text("bot_type"), // 'known_bot' | 'suspected_bot' | null
    uaString: text("ua_string"),
    scrollDepth: integer("scroll_depth"), // 0-100 for scroll events
    ipHash: text("ip_hash"), // hashed for privacy
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_issue_id_idx").on(table.issueId),
    index("analytics_events_subscriber_id_idx").on(table.subscriberId),
    index("analytics_events_event_type_idx").on(table.eventType),
    index("analytics_events_is_bot_idx").on(table.isBot),
    index("analytics_events_created_at_idx").on(table.createdAt),
  ]
);

// Settings table - for SMTP and other configs stored in DB
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id")
    .references(() => creators.id)
    .notNull()
    .unique(),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUser: text("smtp_user"),
  smtpPassEncrypted: text("smtp_pass_encrypted"),
  fromName: text("from_name"),
  fromEmail: text("from_email"),
  anthropicApiKey: text("anthropic_api_key"),
  emailProvider: text("email_provider").default("smtp"), // "smtp" | "resend"
  resendApiKey: text("resend_api_key"),
  welcomeEmailEnabled: boolean("welcome_email_enabled").default(true),
  welcomeEmailSubject: text("welcome_email_subject"),
  welcomeEmailBody: text("welcome_email_body"),
  // Scheduled greeting email
  greetingEmailEnabled: boolean("greeting_email_enabled").default(false),
  greetingDelayDays: integer("greeting_delay_days").default(3),
  greetingEmailSubject: text("greeting_email_subject"),
  greetingEmailBody: text("greeting_email_body"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// External websites table - for embed widget integration
export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: integer("creator_id")
    .references(() => creators.id)
    .notNull(),
  name: text("name").notNull(),        // "我的博客"
  url: text("url").notNull(),           // "https://myblog.com"
  embedKey: text("embed_key").notNull().unique(), // unique token for widget auth
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("websites_creator_id_idx").on(table.creatorId),
  index("websites_embed_key_idx").on(table.embedKey),
]);

// Type exports
export type Creator = typeof creators.$inferSelect;
export type NewCreator = typeof creators.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;
