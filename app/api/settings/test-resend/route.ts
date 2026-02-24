import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { verifyResendConfig } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { apiKey } = await req.json();
  const result = await verifyResendConfig(apiKey);
  return NextResponse.json(result);
}
