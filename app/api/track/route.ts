import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/events";

// Tracking pixel for email opens
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const issueId = searchParams.get("i") || undefined;
  const subscriberId = searchParams.get("s") || undefined;

  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0];

  await trackEvent({
    issueId,
    subscriberId,
    eventType: "open",
    userAgent: ua,
    ip,
  });

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

// For scroll/click events from web view
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { issueId, subscriberId, eventType, scrollDepth } = body;

  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0];

  await trackEvent({
    issueId,
    subscriberId,
    eventType,
    userAgent: ua,
    ip,
    scrollDepth,
  });

  return NextResponse.json({ ok: true });
}
