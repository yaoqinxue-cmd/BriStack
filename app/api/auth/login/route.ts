import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { creators } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    return NextResponse.json(
      { error: "未配置管理密码，请设置 ADMIN_PASSWORD_HASH 环境变量" },
      { status: 500 }
    );
  }

  const isValid = await bcrypt.compare(password, passwordHash);

  if (!isValid) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  // Get or create the creator record
  let creator = await db.query.creators.findFirst();

  if (!creator) {
    // Auto-create creator on first login
    const [newCreator] = await db
      .insert(creators)
      .values({
        name: "我的 Space",
        slug: process.env.CREATOR_SLUG || "my-space",
        email: process.env.SMTP_FROM_EMAIL || "admin@example.com",
        fromName: process.env.SMTP_FROM_NAME || "Space",
        fromEmail: process.env.SMTP_FROM_EMAIL || "admin@example.com",
      })
      .returning();
    creator = newCreator;
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.creatorId = creator.id;
  await session.save();

  return NextResponse.json({ ok: true });
}
