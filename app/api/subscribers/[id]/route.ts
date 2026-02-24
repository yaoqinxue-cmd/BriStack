import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sub = await db.query.subscribers.findFirst({
    where: and(eq(subscribers.id, id), eq(subscribers.creatorId, session.creatorId!)),
  });

  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { tags, notes, level } = body as {
    tags?: string[];
    notes?: string;
    level?: number;
  };

  await db
    .update(subscribers)
    .set({
      ...(tags !== undefined && { tags }),
      ...(notes !== undefined && { notes }),
      ...(level !== undefined && { level }),
      updatedAt: new Date(),
    })
    .where(and(eq(subscribers.id, id), eq(subscribers.creatorId, session.creatorId!)));

  return NextResponse.json({ ok: true });
}
