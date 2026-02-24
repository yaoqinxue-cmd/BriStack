import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(apiKey?: string): Anthropic | null {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!client) {
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

export async function generateSummary(
  content: string,
  title: string,
  apiKey?: string
): Promise<string | null> {
  const ai = getClient(apiKey);
  if (!ai) return null;

  try {
    const message = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `请为以下文章生成一段简洁的摘要（150字以内），要求：
1. 保留作者的核心观点和独特见解
2. 结构清晰，便于AI助手理解和引用
3. 不要使用"本文"、"作者"等词语，直接陈述观点
4. 使用中文

文章标题：${title}

文章内容：
${content.slice(0, 3000)}`,
        },
      ],
    });

    const text = message.content[0];
    if (text.type === "text") {
      return text.text.trim();
    }
    return null;
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return null;
  }
}

export async function extractKeyPoints(
  content: string,
  title: string,
  apiKey?: string
): Promise<string[]> {
  const ai = getClient(apiKey);
  if (!ai) return [];

  try {
    const message = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `请从以下文章中提取3-5个核心论点，每个论点用一句话表达，要求：
1. 每个论点独立、清晰
2. 代表文章最重要的见解
3. 使用中文
4. 输出格式：每行一个论点，不要编号

文章标题：${title}

文章内容：
${content.slice(0, 3000)}`,
        },
      ],
    });

    const text = message.content[0];
    if (text.type === "text") {
      return text.text
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 5);
    }
    return [];
  } catch (error) {
    console.error("Failed to extract key points:", error);
    return [];
  }
}
