import Anthropic from "@anthropic-ai/sdk";

interface PenetrationResult {
  score: number; // 0-100
  aiSummary: string;
  preservedPoints: string[];
  lostPoints: string[];
  suggestions: string[];
}

export async function measurePenetrationRate(
  content: string,
  keyPoints: string[],
  apiKey?: string
): Promise<PenetrationResult | null> {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key || keyPoints.length === 0) return null;

  const client = new Anthropic({ apiKey: key });

  try {
    // Step 1: Ask AI to summarize the content (simulating what user's AI assistant would do)
    const summaryResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `请将以下文章压缩为100字以内的摘要，只保留最重要的信息：

${content.slice(0, 4000)}`,
        },
      ],
    });

    const aiSummary =
      summaryResponse.content[0].type === "text"
        ? summaryResponse.content[0].text.trim()
        : "";

    // Step 2: Check which key points are preserved in the AI summary
    if (keyPoints.length === 0)
      return {
        score: 0,
        aiSummary,
        preservedPoints: [],
        lostPoints: [],
        suggestions: [],
      };

    const checkResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `以下是一篇文章的AI生成摘要和作者认为重要的核心论点。
请判断每个核心论点是否在摘要中得到体现（直接或间接）。

AI摘要：
${aiSummary}

核心论点列表：
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

请以JSON格式回复，格式如下：
{
  "results": [{"point": "论点内容", "preserved": true/false}],
  "suggestions": ["改进建议1", "改进建议2"]
}`,
        },
      ],
    });

    const checkText =
      checkResponse.content[0].type === "text"
        ? checkResponse.content[0].text
        : "{}";

    // Parse the JSON response
    const jsonMatch = checkText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        score: 50,
        aiSummary,
        preservedPoints: [],
        lostPoints: keyPoints,
        suggestions: ["无法解析评估结果"],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      results?: Array<{ point: string; preserved: boolean }>;
      suggestions?: string[];
    };

    const results = parsed.results || [];
    const preserved = results.filter((r) => r.preserved).map((r) => r.point);
    const lost = results.filter((r) => !r.preserved).map((r) => r.point);
    const score =
      keyPoints.length > 0
        ? Math.round((preserved.length / keyPoints.length) * 100)
        : 0;

    return {
      score,
      aiSummary,
      preservedPoints: preserved,
      lostPoints: lost,
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    console.error("Failed to measure penetration rate:", error);
    return null;
  }
}
