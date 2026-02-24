import nodemailer from "nodemailer";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

interface EmailProviderConfig {
  provider: "smtp" | "resend";
  smtp?: SmtpConfig;
  resendApiKey?: string;
  fromName: string;
  fromEmail: string;
}

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  messageId?: string;
  unsubscribeUrl?: string;
}

async function getEmailConfig(creatorId: number): Promise<EmailProviderConfig | null> {
  const setting = await db.query.settings.findFirst({
    where: eq(settings.creatorId, creatorId),
  });

  const fromName = setting?.fromName ?? process.env.SMTP_FROM_NAME ?? "Space";
  const fromEmail = setting?.fromEmail ?? process.env.SMTP_FROM_EMAIL ?? "";

  if (setting?.emailProvider === "resend" && setting.resendApiKey) {
    return { provider: "resend", resendApiKey: setting.resendApiKey, fromName, fromEmail };
  }

  if (setting?.smtpHost && setting.smtpUser && setting.smtpPassEncrypted) {
    return {
      provider: "smtp",
      smtp: {
        host: setting.smtpHost,
        port: setting.smtpPort ?? 587,
        secure: setting.smtpSecure ?? false,
        user: setting.smtpUser,
        pass: setting.smtpPassEncrypted,
        fromName,
        fromEmail,
      },
      fromName,
      fromEmail,
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      provider: "smtp",
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        fromName,
        fromEmail: fromEmail || process.env.SMTP_USER,
      },
      fromName,
      fromEmail: fromEmail || process.env.SMTP_USER!,
    };
  }

  return null;
}

export async function sendEmail(
  creatorId: number,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getEmailConfig(creatorId);
  if (!config) {
    return { success: false, error: "邮件服务未配置，请在 Settings 页面配置 SMTP 或 Resend" };
  }
  if (config.provider === "resend") {
    return sendViaResend(config.resendApiKey!, config, options);
  }
  return sendViaSmtp(config.smtp!, options);
}

async function sendViaResend(
  apiKey: string,
  config: EmailProviderConfig,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = new Resend(apiKey);
    const headers: Record<string, string> = {};
    if (options.unsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${options.unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: options.toName ? `${options.toName} <${options.to}>` : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || config.fromEmail,
      headers,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Resend error" };
  }
}

async function sendViaSmtp(
  config: SmtpConfig,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 20000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo || config.fromEmail,
    headers: {},
  };

  if (options.unsubscribeUrl) {
    mailOptions.headers = {
      ...mailOptions.headers,
      "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMTP error" };
  }
}

export async function verifySmtpConfig(
  config: Partial<SmtpConfig>
): Promise<{ success: boolean; error?: string }> {
  if (!config.host || !config.user || !config.pass) {
    return { success: false, error: "缺少必填字段（Host / 用户名 / 密码）" };
  }
  const port = config.port || 587;
  // Port 465 always uses implicit TLS; otherwise use STARTTLS (secure: false)
  const secure = config.secure !== undefined ? config.secure : port === 465;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 20000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false },
  });
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "连接失败" };
  }
}

export async function verifyResendConfig(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(apiKey);
    await resend.domains.list();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "API Key 无效" };
  }
}
