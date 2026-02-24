import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues, subscribers, creators, apiKeys } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { recordMcpQuery } from "@/lib/analytics/events";
import { hashApiKey } from "@/lib/utils";

export interface McpAuthResult {
  valid: boolean;
  subscriberId?: string;
  creatorId?: number;
}

export async function validateMcpToken(token: string): Promise<McpAuthResult> {
  if (!token) return { valid: false };

  // Check if it's an API key
  if (token.startsWith("lttr_")) {
    const keyHash = hashApiKey(token);
    const apiKey = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.keyHash, keyHash), sql`${apiKeys.revokedAt} IS NULL`),
    });

    if (apiKey) {
      const subscriber = await db.query.subscribers.findFirst({
        where: eq(subscribers.id, apiKey.subscriberId),
        columns: { id: true, creatorId: true, status: true },
      });

      if (subscriber && subscriber.status === "active") {
        // Update usage stats
        await db
          .update(apiKeys)
          .set({
            lastUsedAt: new Date(),
            totalCalls: sql`${apiKeys.totalCalls} + 1`,
          })
          .where(eq(apiKeys.id, apiKey.id));

        return {
          valid: true,
          subscriberId: subscriber.id,
          creatorId: subscriber.creatorId,
        };
      }
    }
  }

  return { valid: false };
}

export function createMcpServer(creatorId: number) {
  const server = new McpServer({
    name: "bristack-space",
    version: "1.0.0",
  });

  // Tool: list_issues
  server.tool(
    "list_issues",
    "获取最新的 Space 内容列表，包含标题、摘要和关键论点",
    {
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("返回条数，最多20条"),
      offset: z.number().min(0).default(0).describe("分页偏移"),
    },
    async ({ limit, offset }, extra) => {
      const issueList = await db.query.issues.findMany({
        where: and(
          eq(issues.creatorId, creatorId),
          eq(issues.status, "published")
        ),
        orderBy: [desc(issues.publishedAt)],
        limit,
        offset,
        columns: {
          id: true,
          title: true,
          summary: true,
          keyPoints: true,
          topics: true,
          readingTimeMinutes: true,
          publishedAt: true,
          authorNote: true,
        },
      });

      const formatted = issueList.map((issue) => ({
        id: issue.id,
        title: issue.title,
        summary: issue.summary || "（暂无摘要）",
        key_points: issue.keyPoints || [],
        topics: issue.topics || [],
        reading_time_minutes: issue.readingTimeMinutes,
        published_at: issue.publishedAt?.toISOString(),
        has_author_note: !!issue.authorNote,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total: issueList.length,
                issues: formatted,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: get_issue
  server.tool(
    "get_issue",
    "获取特定 Space 内容的完整正文（Markdown 格式）",
    {
      id: z.string().uuid().describe("内容 ID"),
    },
    async ({ id }) => {
      const issue = await db.query.issues.findFirst({
        where: and(
          eq(issues.id, id),
          eq(issues.creatorId, creatorId),
          eq(issues.status, "published")
        ),
      });

      if (!issue) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "内容不存在或未发布" }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: issue.id,
                title: issue.title,
                summary: issue.summary,
                key_points: issue.keyPoints,
                topics: issue.topics,
                author_note: issue.authorNote,
                human_written: issue.humanWritten,
                full_content: issue.fullMarkdown,
                reading_time_minutes: issue.readingTimeMinutes,
                published_at: issue.publishedAt?.toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: search_content
  server.tool(
    "search_content",
    "在 Space 历史内容中语义搜索，找到相关文章",
    {
      query: z.string().min(2).describe("搜索关键词或问题"),
      limit: z.number().min(1).max(10).default(5).describe("返回结果数"),
    },
    async ({ query, limit }) => {
      // Basic text search (in production, use pgvector for semantic search)
      const results = await db.query.issues.findMany({
        where: and(
          eq(issues.creatorId, creatorId),
          eq(issues.status, "published"),
          or(
            ilike(issues.title, `%${query}%`),
            ilike(issues.summary, `%${query}%`),
            ilike(issues.fullMarkdown, `%${query}%`),
            sql`${issues.topics} @> ARRAY[${query}]::text[]`
          )
        ),
        orderBy: [desc(issues.publishedAt)],
        limit,
        columns: {
          id: true,
          title: true,
          summary: true,
          keyPoints: true,
          topics: true,
          publishedAt: true,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                results: results.map((r) => ({
                  id: r.id,
                  title: r.title,
                  summary: r.summary,
                  key_points: r.keyPoints,
                  topics: r.topics,
                  published_at: r.publishedAt?.toISOString(),
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: get_author_info
  server.tool(
    "get_author_info",
    "获取创作者信息和 Space 简介",
    {},
    async () => {
      const creator = await db.query.creators.findFirst({
        where: eq(creators.id, creatorId),
        columns: { id: true, name: true, slug: true, bio: true },
      });

      if (!creator) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: "Creator not found" }) },
          ],
          isError: true,
        };
      }

      const issueCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(issues)
        .where(
          and(eq(issues.creatorId, creatorId), eq(issues.status, "published"))
        );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: creator.name,
              slug: creator.slug,
              bio: creator.bio,
              total_issues: Number(issueCount[0]?.count || 0),
              subscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/${creator.slug}`,
            }),
          },
        ],
      };
    }
  );

  return server;
}
