import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateUnsubscribeToken } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/events";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  if (!id || !token) {
    return new NextResponse("Invalid unsubscribe link", { status: 400 });
  }

  const expectedToken = generateUnsubscribeToken(id);
  if (token !== expectedToken) {
    return new NextResponse("Invalid token", { status: 400 });
  }

  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.id, id),
  });

  if (!subscriber) {
    return new NextResponse("Subscriber not found", { status: 404 });
  }

  await db
    .update(subscribers)
    .set({ status: "unsubscribed", updatedAt: new Date() })
    .where(eq(subscribers.id, id));

  await trackEvent({
    subscriberId: id,
    eventType: "unsubscribe",
  });

  return NextResponse.redirect(
    new URL(
      `/unsubscribed?name=${encodeURIComponent(subscriber.name || "")}`,
      req.url
    )
  );
}

export async function POST(req: NextRequest) {
  const { id, token } = await req.json();

  if (!id || !token) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const expectedToken = generateUnsubscribeToken(id);
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await db
    .update(subscribers)
    .set({ status: "unsubscribed", updatedAt: new Date() })
    .where(eq(subscribers.id, id));

  return NextResponse.json({ ok: true });
}
