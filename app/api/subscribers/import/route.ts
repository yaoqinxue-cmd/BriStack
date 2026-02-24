import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { rows } = body as { rows: { email: string; name?: string; tags?: string }[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  let imported = 0, skipped = 0, failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      failed++;
      errors.push(`Invalid email: ${row.email}`);
      continue;
    }

    // Check duplicate
    const existing = await db.query.subscribers.findFirst({
      where: and(
        eq(subscribers.creatorId, session.creatorId!),
        eq(subscribers.email, email)
      ),
      columns: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const tags = row.tags
      ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      await db.insert(subscribers).values({
        creatorId: session.creatorId!,
        type: "human",
        email,
        name: row.name?.trim() || null,
        tags,
        status: "active",
        level: 1,
      });
      imported++;
    } catch {
      failed++;
      errors.push(`Failed to import: ${email}`);
    }
  }

  return NextResponse.json({ imported, skipped, failed, errors });
}
