import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { settings, creators, subscribers } from "@/lib/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [creator, setting, landingPageCountResult] = await Promise.all([
    db.query.creators.findFirst({ where: eq(creators.id, session.creatorId!) }),
    db.query.settings.findFirst({ where: eq(settings.creatorId, session.creatorId!) }),
    db.select({ count: count() }).from(subscribers).where(
      and(
        eq(subscribers.creatorId, session.creatorId!),
        eq(subscribers.status, "active"),
        eq(subscribers.type, "human"),
        isNull(subscribers.sourceWebsiteId)
      )
    ),
  ]);

  return NextResponse.json({
    landingPageSubscriberCount: Number(landingPageCountResult[0]?.count || 0),
    name: creator?.name || "",
    slug: creator?.slug || "",
    bio: creator?.bio || "",
    avatarUrl: creator?.avatarUrl || "",
    fromName: creator?.fromName || setting?.fromName || "",
    fromEmail: creator?.fromEmail || setting?.fromEmail || "",
    smtpHost: setting?.smtpHost || "",
    smtpPort: setting?.smtpPort || 587,
    smtpSecure: setting?.smtpSecure || false,
    smtpUser: setting?.smtpUser || "",
    smtpPass: setting?.smtpPassEncrypted ? "••••••••" : "",
    anthropicApiKey: setting?.anthropicApiKey ? "••••••••" : "",
    emailProvider: setting?.emailProvider || "smtp",
    resendApiKey: setting?.resendApiKey ? "••••••••" : "",
    welcomeEmailEnabled: setting?.welcomeEmailEnabled !== false,
    welcomeEmailSubject: setting?.welcomeEmailSubject || "",
    welcomeEmailBody: setting?.welcomeEmailBody || "",
    greetingEmailEnabled: setting?.greetingEmailEnabled || false,
    greetingDelayDays: setting?.greetingDelayDays ?? 3,
    greetingEmailSubject: setting?.greetingEmailSubject || "",
    greetingEmailBody: setting?.greetingEmailBody || "",
  });
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, slug, bio, avatarUrl, fromName, fromEmail,
    smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass,
    anthropicApiKey, emailProvider, resendApiKey,
    welcomeEmailEnabled, welcomeEmailSubject, welcomeEmailBody,
    greetingEmailEnabled, greetingDelayDays, greetingEmailSubject, greetingEmailBody,
  } = body;

  // Update creator info
  await db
    .update(creators)
    .set({
      name: name || undefined,
      slug: slug || undefined,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      fromName: fromName || null,
      fromEmail: fromEmail || null,
      updatedAt: new Date(),
    })
    .where(eq(creators.id, session.creatorId!));

  // Upsert settings
  const settingValues: typeof settings.$inferInsert = {
    creatorId: session.creatorId!,
    smtpHost: smtpHost || null,
    smtpPort: smtpPort || 587,
    smtpSecure: smtpSecure || false,
    smtpUser: smtpUser || null,
    welcomeEmailEnabled: welcomeEmailEnabled !== false,
    welcomeEmailSubject: welcomeEmailSubject || null,
    welcomeEmailBody: welcomeEmailBody || null,
    greetingEmailEnabled: greetingEmailEnabled || false,
    greetingDelayDays: greetingDelayDays ?? 3,
    greetingEmailSubject: greetingEmailSubject || null,
    greetingEmailBody: greetingEmailBody || null,
    updatedAt: new Date(),
    fromName: fromName || null,
    fromEmail: fromEmail || null,
  };

  if (smtpPass && smtpPass !== "••••••••") {
    settingValues.smtpPassEncrypted = smtpPass;
  }
  if (anthropicApiKey && anthropicApiKey !== "••••••••") {
    settingValues.anthropicApiKey = anthropicApiKey;
  }
  settingValues.emailProvider = emailProvider || "smtp";
  if (resendApiKey && resendApiKey !== "••••••••") {
    settingValues.resendApiKey = resendApiKey;
  }

  await db
    .insert(settings)
    .values(settingValues)
    .onConflictDoUpdate({
      target: settings.creatorId,
      set: settingValues,
    });

  return NextResponse.json({ ok: true });
}
