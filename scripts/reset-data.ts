/**
 * Data reset script — clears all interaction records and test subscribers.
 * Preserves: creators, settings, websites, issues (content).
 *
 * Usage:
 *   npx tsx scripts/reset-data.ts
 *
 * Requires DATABASE_URL as environment variable
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function reset() {
  console.log("🧹 Resetting interaction data...\n");

  // 1. Analytics events (open, click, scroll, subscribe, etc.)
  const eventsResult = await db.delete(schema.analyticsEvents).returning({ id: schema.analyticsEvents.id });
  console.log(`✅ Deleted ${eventsResult.length} analytics events`);

  // 2. Deliveries (email send records)
  const deliveriesResult = await db.delete(schema.deliveries).returning({ id: schema.deliveries.id });
  console.log(`✅ Deleted ${deliveriesResult.length} delivery records`);

  // 3. API Keys (agent subscriber keys)
  const apiKeysResult = await db.delete(schema.apiKeys).returning({ id: schema.apiKeys.id });
  console.log(`✅ Deleted ${apiKeysResult.length} API keys`);

  // 4. Subscribers (all test subscribers — human, agent, mcp)
  const subscribersResult = await db.delete(schema.subscribers).returning({ id: schema.subscribers.id });
  console.log(`✅ Deleted ${subscribersResult.length} subscribers`);

  console.log("\n✨ Done! Preserved: creators, settings, websites, issues (content).");
  console.log("   Your login credentials, SMTP config, and published content remain intact.");
  process.exit(0);
}

reset().catch(err => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
