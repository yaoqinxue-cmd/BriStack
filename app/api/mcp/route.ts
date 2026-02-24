import { NextRequest, NextResponse } from "next/server";
import { createMcpServer, validateMcpToken } from "@/lib/mcp/server";
import { db } from "@/lib/db";
import { creators } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { recordMcpQuery } from "@/lib/analytics/events";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export const dynamic = "force-dynamic";

async function getCreator(slug: string) {
  return db.query.creators.findFirst({
    where: eq(creators.slug, slug),
  });
}

export async function POST(req: NextRequest) {
  const creatorSlug =
    req.headers.get("x-creator-slug") ||
    process.env.CREATOR_SLUG ||
    "newsletter";

  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.replace("Bearer ", "") ||
    req.headers.get("x-subscriber-token") ||
    "";

  const creator = await getCreator(creatorSlug);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  let subscriberId: string | undefined;
  if (token) {
    const auth = await validateMcpToken(token);
    if (auth.valid) {
      subscriberId = auth.subscriberId;
    }
  }

  if (subscriberId) {
    recordMcpQuery(subscriberId).catch(console.error);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 }
    );
  }

  const { method, id, params } = body as {
    method: string;
    id: unknown;
    params?: Record<string, unknown>;
  };

  try {
    const server = createMcpServer(creator.id);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    const client = new Client({ name: "bristack-http-bridge", version: "1.0.0" });
    await client.connect(clientTransport);

    let result: unknown;

    if (method === "initialize") {
      result = {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "bristack-space", version: "1.0.0" },
      };
    } else if (method === "tools/list") {
      result = await client.listTools();
    } else if (method === "tools/call") {
      const { name, arguments: args } = (params || {}) as {
        name: string;
        arguments?: Record<string, unknown>;
      };
      result = await client.callTool({ name, arguments: args || {} });
    } else if (method === "ping") {
      result = {};
    } else {
      await client.close();
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
    }

    await client.close();
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    console.error("MCP error:", error);
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : "Internal error",
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const creatorSlug =
    req.headers.get("x-creator-slug") ||
    process.env.CREATOR_SLUG ||
    "space";

  const creator = await getCreator(creatorSlug);

  return NextResponse.json({
    name: "bristack-space",
    version: "1.0.0",
    description: creator
      ? `${creator.name} 的 Space MCP Server`
      : "Space MCP Server",
    tools: [
      { name: "list_issues", description: "获取最新的 Space 内容列表" },
      { name: "get_issue", description: "获取特定内容的完整正文" },
      { name: "search_content", description: "语义搜索历史内容" },
      { name: "get_author_info", description: "获取创作者信息" },
    ],
    usage: {
      claude_desktop: {
        config: {
          mcpServers: {
            [creatorSlug]: {
              url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mcp`,
              headers: { "x-creator-slug": creatorSlug },
            },
          },
        },
      },
    },
  });
}
