import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { websites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { welcomeEmailEnabled, welcomeEmailSubject, welcomeEmailBody } = await req.json();

  await db
    .update(websites)
    .set({
      welcomeEmailEnabled: welcomeEmailEnabled ?? false,
      welcomeEmailSubject: welcomeEmailSubject || null,
      welcomeEmailBody: welcomeEmailBody || null,
    })
    .where(and(eq(websites.id, id), eq(websites.creatorId, session.creatorId!)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(websites)
    .where(and(eq(websites.id, id), eq(websites.creatorId, session.creatorId!)));

  return NextResponse.json({ ok: true });
}
