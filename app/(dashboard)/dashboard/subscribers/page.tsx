import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getSubscriberLevelLabel, getSubscriberLevelColor, formatDate } from "@/lib/utils";
import { Users, Zap, Bot, Upload } from "lucide-react";
import Link from "next/link";

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  const creatorId = session.creatorId!;
  const { tab } = await searchParams;

  const activeTab = tab === "agent" ? "agent" : tab === "mcp" ? "mcp" : "human";

  const typeMap: Record<string, "human" | "agent" | "mcp"> = {
    human: "human",
    agent: "agent",
    mcp: "mcp",
  };

  const subList = await db.query.subscribers.findMany({
    where: and(
      eq(subscribers.creatorId, creatorId),
      eq(subscribers.type, typeMap[activeTab])
    ),
    orderBy: [desc(subscribers.subscribedAt)],
    limit: 100,
  });

  const [humanCountResult, agentCountResult, mcpCountResult] = await Promise.all([
    db.select({ count: count() }).from(subscribers).where(and(eq(subscribers.creatorId, creatorId), eq(subscribers.type, "human"), eq(subscribers.status, "active"))),
    db.select({ count: count() }).from(subscribers).where(and(eq(subscribers.creatorId, creatorId), eq(subscribers.type, "agent"), eq(subscribers.status, "active"))),
    db.select({ count: count() }).from(subscribers).where(and(eq(subscribers.creatorId, creatorId), eq(subscribers.type, "mcp"), eq(subscribers.status, "active"))),
  ]);
  const humanCount = Number(humanCountResult[0]?.count || 0);
  const agentCount = Number(agentCountResult[0]?.count || 0);
  const mcpCount = Number(mcpCountResult[0]?.count || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">订阅者管理</h1>
        <Link
          href="/dashboard/subscribers/import"
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          导入 CSV
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { label: "人类", value: "human", count: humanCount, icon: Users },
          { label: "AI Agent", value: "agent", count: agentCount, icon: Zap },
          { label: "MCP", value: "mcp", count: mcpCount, icon: Bot },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.value}
              href={`/dashboard/subscribers?tab=${t.value}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className="ml-0.5 text-xs text-gray-400">({t.count})</span>
            </Link>
          );
        })}
      </div>

      {/* Subscriber table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {subList.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {activeTab === "human" && (
              <div className="space-y-2">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>还没有人类订阅者</p>
                <p className="text-xs">分享你的订阅页面：<code className="bg-gray-100 px-1.5 py-0.5 rounded">/subscribe/{process.env.CREATOR_SLUG || "your-slug"}</code></p>
              </div>
            )}
            {activeTab === "agent" && (
              <div className="space-y-2">
                <Zap className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>还没有 Agent 订阅者</p>
                <p className="text-xs">Agent 可通过 <code className="bg-gray-100 px-1.5 py-0.5 rounded">POST /api/v1/agent/subscribe</code> 注册</p>
              </div>
            )}
            {activeTab === "mcp" && (
              <div className="space-y-2">
                <Bot className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>还没有 MCP 连接</p>
                <p className="text-xs">MCP Server 地址：<code className="bg-gray-100 px-1.5 py-0.5 rounded">/api/mcp</code></p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    {activeTab === "human" ? "邮箱" : "Agent ID"}
                  </th>
                  {activeTab === "human" && (
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                      关系等级
                    </th>
                  )}
                  {activeTab === "agent" && (
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                      类型
                    </th>
                  )}
                  <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    状态
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    订阅时间
                  </th>
                  {activeTab === "human" && (
                    <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                      标签
                    </th>
                  )}
                  <th className="px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    最近活跃
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-800">
                      {activeTab === "human" ? (
                        <Link href={`/dashboard/subscribers/${sub.id}`} className="block hover:text-indigo-600">
                          <div className="font-medium">{sub.email}</div>
                          {sub.name && <div className="text-xs text-gray-400">{sub.name}</div>}
                        </Link>
                      ) : (
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {sub.agentId}
                        </code>
                      )}
                    </td>
                    {activeTab === "human" && (
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSubscriberLevelColor(sub.level)}`}>
                          {getSubscriberLevelLabel(sub.level)}
                        </span>
                      </td>
                    )}
                    {activeTab === "agent" && (
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {sub.agentType || "未知"}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sub.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {sub.status === "active" ? "活跃" : "已退订"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {formatDate(sub.subscribedAt)}
                    </td>
                    {activeTab === "human" && (
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(sub.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {(sub.tags || []).length > 3 && (
                            <span className="text-xs text-gray-400">+{(sub.tags || []).length - 3}</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {formatDate(sub.lastActivityAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
