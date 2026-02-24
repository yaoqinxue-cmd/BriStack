import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { websites, creators } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const site = await db.query.websites.findFirst({
    where: eq(websites.embedKey, key),
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, site.creatorId),
    columns: { name: true, slug: true },
  });

  return NextResponse.json({
    creatorName: creator?.name || "Space",
    embedKey: key,
    websiteName: site.name,
  });
}
