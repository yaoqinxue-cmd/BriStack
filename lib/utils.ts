import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash, randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `lttr_${randomBytes(32).toString("hex")}`;
  const prefix = key.slice(0, 12);
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.SESSION_SECRET || "")).digest("hex").slice(0, 16);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function generateUnsubscribeToken(subscriberId: string): string {
  return createHash("sha256")
    .update(subscriberId + process.env.SESSION_SECRET)
    .digest("hex")
    .slice(0, 32);
}

export function getSubscriberLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "已订阅",
    2: "已验证",
    3: "活跃关系",
    4: "核心圈",
  };
  return labels[level] || "未知";
}

export function getSubscriberLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: "bg-gray-100 text-gray-700",
    2: "bg-blue-100 text-blue-700",
    3: "bg-green-100 text-green-700",
    4: "bg-purple-100 text-purple-700",
  };
  return colors[level] || "bg-gray-100 text-gray-700";
}
