import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { websites, subscribers } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [list, counts] = await Promise.all([
    db.query.websites.findMany({
      where: eq(websites.creatorId, session.creatorId!),
      orderBy: (w, { desc }) => [desc(w.createdAt)],
    }),
    db.select({ websiteId: subscribers.sourceWebsiteId, count: count() })
      .from(subscribers)
      .where(and(
        eq(subscribers.creatorId, session.creatorId!),
        eq(subscribers.status, "active"),
        eq(subscribers.type, "human"),
      ))
      .groupBy(subscribers.sourceWebsiteId),
  ]);

  const countMap = new Map(counts.map(c => [c.websiteId, Number(c.count)]));

  return NextResponse.json(list.map(site => ({
    ...site,
    subscriberCount: countMap.get(site.id) || 0,
  })));
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, url } = await req.json();
  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const embedKey = randomUUID().replace(/-/g, "").slice(0, 24);

  const [site] = await db
    .insert(websites)
    .values({
      creatorId: session.creatorId!,
      name: name.trim(),
      url: url.trim(),
      embedKey,
    })
    .returning();

  return NextResponse.json(site);
}
