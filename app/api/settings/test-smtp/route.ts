import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { verifySmtpConfig } from "@/lib/email/sender";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { host, port, secure, user, pass } = await req.json();

  // If the password field is masked (user hasn't re-entered it), use the saved one from DB
  let realPass = pass;
  if (!pass || pass === "••••••••") {
    const saved = await db.query.settings.findFirst({
      where: eq(settings.creatorId, session.creatorId!),
      columns: { smtpPassEncrypted: true },
    });
    realPass = saved?.smtpPassEncrypted || "";
    if (!realPass) {
      return NextResponse.json({ success: false, error: "未找到已保存的 SMTP 密码，请重新填写密码后再测试" });
    }
  }

  const result = await verifySmtpConfig({ host, port, secure, user, pass: realPass });
  return NextResponse.json(result);
}
