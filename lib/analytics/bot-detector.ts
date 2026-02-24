import { isbot } from "isbot";

export interface BotDetectionResult {
  isBot: boolean;
  botType: "known_bot" | "suspected_bot" | null;
  confidence: number; // 0-1
  reason?: string;
}

// Known AI bot UA patterns (beyond isbot's list)
const AI_BOT_PATTERNS = [
  /GPTBot/i,
  /ClaudeBot/i,
  /Claude-Web/i,
  /PerplexityBot/i,
  /Applebot/i,
  /cohere-ai/i,
  /anthropic-ai/i,
  /openai/i,
  /meta-externalagent/i,
  /facebookexternalhit/i,
  /Bytespider/i,
  /PetalBot/i,
];

// Cloud provider IP ranges (simplified - in production use a proper list)
const CLOUD_IP_PREFIXES = [
  "3.",    // AWS
  "13.",   // AWS
  "18.",   // AWS
  "34.",   // GCP
  "35.",   // GCP
  "104.",  // GCP/Cloudflare
  "20.",   // Azure
  "40.",   // Azure
  "52.",   // Azure/AWS
];

export function detectBot(
  userAgent: string | null,
  options?: {
    ip?: string;
    requestTimeMs?: number; // How fast the request was processed
    hasMouseMovement?: boolean;
  }
): BotDetectionResult {
  if (!userAgent) {
    return {
      isBot: true,
      botType: "suspected_bot",
      confidence: 0.7,
      reason: "no_user_agent",
    };
  }

  // Check isbot library (covers hundreds of known bots)
  if (isbot(userAgent)) {
    // Check if it's an AI bot specifically
    const isAiBot = AI_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
    return {
      isBot: true,
      botType: "known_bot",
      confidence: 0.99,
      reason: isAiBot ? "known_ai_bot" : "known_bot",
    };
  }

  // Check AI bot patterns not in isbot
  const matchedAiPattern = AI_BOT_PATTERNS.some((pattern) =>
    pattern.test(userAgent)
  );
  if (matchedAiPattern) {
    return {
      isBot: true,
      botType: "known_bot",
      confidence: 0.95,
      reason: "ai_bot_pattern",
    };
  }

  // Behavioral heuristics
  let suspicionScore = 0;
  const reasons: string[] = [];

  // Extremely fast request (< 50ms suggests automated)
  if (options?.requestTimeMs !== undefined && options.requestTimeMs < 50) {
    suspicionScore += 0.3;
    reasons.push("instant_response");
  }

  // No mouse movement indicator (for page events)
  if (options?.hasMouseMovement === false) {
    suspicionScore += 0.2;
    reasons.push("no_mouse_movement");
  }

  // Cloud IP
  if (options?.ip) {
    const isCloudIp = CLOUD_IP_PREFIXES.some((prefix) =>
      options.ip!.startsWith(prefix)
    );
    if (isCloudIp) {
      suspicionScore += 0.2;
      reasons.push("cloud_ip");
    }
  }

  if (suspicionScore >= 0.5) {
    return {
      isBot: true,
      botType: "suspected_bot",
      confidence: suspicionScore,
      reason: reasons.join(","),
    };
  }

  return {
    isBot: false,
    botType: null,
    confidence: 1 - suspicionScore,
  };
}

export function getBotCategory(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  if (/GPTBot|openai/i.test(userAgent)) return "openai";
  if (/ClaudeBot|Claude-Web|anthropic/i.test(userAgent)) return "anthropic";
  if (/PerplexityBot/i.test(userAgent)) return "perplexity";
  if (/Googlebot|Google-Extended/i.test(userAgent)) return "google";
  if (/Bingbot/i.test(userAgent)) return "bing";
  if (/Applebot/i.test(userAgent)) return "apple";
  if (isbot(userAgent)) return "other_bot";
  return "human";
}
