import { db } from "@/lib/db";
import { issues, subscribers, analyticsEvents, deliveries } from "@/lib/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { FileText, Users, BarChart2, Zap, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  const creatorId = session.creatorId!;

  const [
    totalIssues,
    publishedIssues,
    humanSubs,
    agentSubs,
    mcpSubs,
    recentEvents,
    recentIssues,
  ] = await Promise.all([
    db.select({ count: count() }).from(issues).where(eq(issues.creatorId, creatorId)),
    db.select({ count: count() }).from(issues).where(and(eq(issues.creatorId, creatorId), eq(issues.status, "published"))),
    db.select({ count: count() }).from(subscribers).where(and(eq(subscribers.creatorId, creatorId), eq(subscribers.type, "human"), eq(subscribers.status, "active"))),
    db.select({ count: count() }).from(subscribers).where(and(eq(subscribers.creatorId, creatorId), eq(subscribers.type, "agent"), eq(subscribers.status, "active"))),
    db.select({ count: count() }).from(subscribers).where(and(eq(subscribers.creatorId, creatorId), eq(subscribers.type, "mcp"), eq(subscribers.status, "active"))),
    db.select({
      humanEvents: sql<number>`sum(case when is_bot = false then 1 else 0 end)`,
      botEvents: sql<number>`sum(case when is_bot = true then 1 else 0 end)`,
      agentQueries: sql<number>`sum(case when event_type = 'agent_query' then 1 else 0 end)`,
      mcpQueries: sql<number>`sum(case when event_type = 'mcp_query' then 1 else 0 end)`,
    }).from(analyticsEvents),
    db.query.issues.findMany({
      where: eq(issues.creatorId, creatorId),
      orderBy: [desc(issues.createdAt)],
      limit: 5,
      columns: { id: true, title: true, status: true, publishedAt: true, contentPenetrationScore: true },
    }),
  ]);

  const stats = {
    totalIssues: Number(totalIssues[0]?.count || 0),
    publishedIssues: Number(publishedIssues[0]?.count || 0),
    humanSubs: Number(humanSubs[0]?.count || 0),
    agentSubs: Number(agentSubs[0]?.count || 0),
    mcpSubs: Number(mcpSubs[0]?.count || 0),
    humanEvents: Number(recentEvents[0]?.humanEvents || 0),
    botEvents: Number(recentEvents[0]?.botEvents || 0),
    agentQueries: Number(recentEvents[0]?.agentQueries || 0),
    mcpQueries: Number(recentEvents[0]?.mcpQueries || 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">仪表盘</h1>
        <Link
          href="/dashboard/content/new"
          className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建内容
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="已发布内容"
          value={stats.publishedIssues}
          sub={`共 ${stats.totalIssues} 篇`}
          icon={<FileText className="w-5 h-5 text-gray-500" />}
          href="/dashboard/content"
        />
        <StatCard
          label="人类订阅者"
          value={stats.humanSubs}
          sub="真实用户"
          icon={<Users className="w-5 h-5 text-blue-500" />}
          href="/dashboard/subscribers"
        />
        <StatCard
          label="Agent 订阅者"
          value={stats.agentSubs}
          sub={`${stats.mcpSubs} 个 MCP 连接`}
          icon={<Zap className="w-5 h-5 text-purple-500" />}
          href="/dashboard/subscribers?tab=agent"
        />
        <StatCard
          label="Agent 查询"
          value={stats.agentQueries + stats.mcpQueries}
          sub={`${stats.humanEvents} 次人类访问`}
          icon={<BarChart2 className="w-5 h-5 text-green-500" />}
          href="/dashboard/analytics"
        />
      </div>

      {/* Dual Track Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Human Track */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            人类影响力
          </h2>
          <div className="space-y-3">
            <MetricRow label="真实人类访问" value={stats.humanEvents} />
            <MetricRow label="活跃人类订阅者" value={stats.humanSubs} />
            <MetricRow
              label="Bot 流量（已排除）"
              value={stats.botEvents}
              valueClass="text-gray-400"
            />
          </div>
        </div>

        {/* AI Track */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            AI 生态影响力
          </h2>
          <div className="space-y-3">
            <MetricRow label="Agent API 查询" value={stats.agentQueries} />
            <MetricRow label="MCP 查询" value={stats.mcpQueries} />
            <MetricRow label="Agent 订阅者" value={stats.agentSubs} />
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">最近内容</h2>
          <Link href="/dashboard/content" className="text-xs text-indigo-600 hover:text-indigo-800">
            查看全部
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentIssues.length === 0 && (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              还没有内容，
              <Link href="/dashboard/content/new" className="text-indigo-600 hover:underline">
                创建第一篇
              </Link>
            </div>
          )}
          {recentIssues.map((issue) => (
            <Link
              key={issue.id}
              href={`/dashboard/content/${issue.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    issue.status === "published"
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span className="text-sm text-gray-800 truncate">{issue.title}</span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                {issue.contentPenetrationScore !== null && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      issue.contentPenetrationScore >= 70
                        ? "bg-green-100 text-green-700"
                        : issue.contentPenetrationScore >= 40
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    穿透率 {issue.contentPenetrationScore.toFixed(0)}%
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {issue.status === "published"
                    ? formatDateTime(issue.publishedAt)
                    : "草稿"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  href,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </Link>
  );
}

function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClass || "text-gray-900"}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
