import { db } from "@/lib/db";
import { analyticsEvents, issues } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export default async function AnalyticsPage() {
  const session = await getSession();
  const creatorId = session.creatorId!;

  // Aggregate stats
  const [overallStats, recentIssuesStats, botBreakdown] = await Promise.all([
    db.select({
      totalEvents: sql<number>`count(*)`,
      humanEvents: sql<number>`sum(case when is_bot = false then 1 else 0 end)`,
      botEvents: sql<number>`sum(case when is_bot = true then 1 else 0 end)`,
      openEvents: sql<number>`sum(case when event_type = 'open' and is_bot = false then 1 else 0 end)`,
      scrollEvents: sql<number>`sum(case when event_type = 'scroll' and is_bot = false then 1 else 0 end)`,
      agentQueries: sql<number>`sum(case when event_type = 'agent_query' then 1 else 0 end)`,
      mcpQueries: sql<number>`sum(case when event_type = 'mcp_query' then 1 else 0 end)`,
    }).from(analyticsEvents),

    db.select({
      issueId: analyticsEvents.issueId,
      title: issues.title,
      humanOpens: sql<number>`sum(case when event_type = 'open' and is_bot = false then 1 else 0 end)`,
      botOpens: sql<number>`sum(case when event_type = 'open' and is_bot = true then 1 else 0 end)`,
      agentQueries: sql<number>`sum(case when event_type = 'agent_query' then 1 else 0 end)`,
      penetrationScore: issues.contentPenetrationScore,
    })
    .from(analyticsEvents)
    .leftJoin(issues, eq(analyticsEvents.issueId, issues.id))
    .where(eq(issues.creatorId, creatorId))
    .groupBy(analyticsEvents.issueId, issues.title, issues.contentPenetrationScore)
    .orderBy(desc(sql`sum(case when event_type = 'open' then 1 else 0 end)`))
    .limit(10),

    db.select({
      botType: analyticsEvents.botType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.isBot, true))
    .groupBy(analyticsEvents.botType)
    .orderBy(desc(sql`count(*)`)),
  ]);

  const stats = overallStats[0];

  const humanRate =
    Number(stats?.totalEvents) > 0
      ? Math.round((Number(stats.humanEvents) / Number(stats.totalEvents)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">分析仪表盘</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="总事件数"
          value={Number(stats?.totalEvents || 0).toLocaleString()}
          sub="所有渠道"
          color="gray"
        />
        <MetricCard
          label="真实人类访问"
          value={Number(stats?.humanEvents || 0).toLocaleString()}
          sub={`占总事件 ${humanRate}%`}
          color="blue"
        />
        <MetricCard
          label="Agent/MCP 查询"
          value={(Number(stats?.agentQueries || 0) + Number(stats?.mcpQueries || 0)).toLocaleString()}
          sub="AI 消费"
          color="purple"
        />
        <MetricCard
          label="Bot 流量（排除）"
          value={Number(stats?.botEvents || 0).toLocaleString()}
          sub="不计入人类指标"
          color="gray"
          dim
        />
      </div>

      {/* Dual Track */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Human Track */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <h2 className="font-semibold text-gray-800">人类影响力</h2>
          </div>
          <div className="space-y-3">
            <Row label="真实打开次数" value={Number(stats?.openEvents || 0)} />
            <Row label="阅读完成次数（滚动到底）" value={Number(stats?.scrollEvents || 0)} />
            <div className="pt-2 border-t border-gray-100">
              <Row
                label="Bot 流量（已从以上数据排除）"
                value={Number(stats?.botEvents || 0)}
                dim
              />
            </div>
          </div>
        </div>

        {/* AI Track */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
            <h2 className="font-semibold text-gray-800">AI 生态影响力</h2>
          </div>
          <div className="space-y-3">
            <Row label="Agent API 查询" value={Number(stats?.agentQueries || 0)} />
            <Row label="MCP Server 查询" value={Number(stats?.mcpQueries || 0)} />
            <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
              每次查询代表一次高意图的内容访问
            </div>
          </div>
        </div>
      </div>

      {/* Bot Breakdown */}
      {botBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Bot 流量来源</h2>
          <div className="space-y-2">
            {botBreakdown.map((bot) => (
              <div key={bot.botType || "unknown"} className="flex items-center gap-3">
                <div className="text-sm text-gray-600 w-32 flex-shrink-0">
                  {bot.botType === "known_bot" ? "已知 Bot" :
                   bot.botType === "suspected_bot" ? "疑似 Bot" : "未分类"}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (Number(bot.count) / Math.max(...botBreakdown.map(b => Number(b.count)))) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-sm text-gray-500 w-16 text-right">
                  {Number(bot.count).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-issue stats */}
      {recentIssuesStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">内容表现</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">内容</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">人类打开</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Bot 打开</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Agent 查询</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">内容穿透率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentIssuesStats.map((issue, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-800 max-w-xs truncate">
                      {issue.title || "未知内容"}
                    </td>
                    <td className="px-5 py-3 text-blue-600 font-medium">
                      {Number(issue.humanOpens || 0)}
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {Number(issue.botOpens || 0)}
                    </td>
                    <td className="px-5 py-3 text-purple-600 font-medium">
                      {Number(issue.agentQueries || 0)}
                    </td>
                    <td className="px-5 py-3">
                      {issue.penetrationScore !== null ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          Number(issue.penetrationScore) >= 70
                            ? "bg-green-100 text-green-700"
                            : Number(issue.penetrationScore) >= 40
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {Number(issue.penetrationScore).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">未测量</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
  dim,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  dim?: boolean;
}) {
  const dotColors: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    gray: "bg-gray-400",
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${dim ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dotColors[color] || "bg-gray-400"}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

function Row({
  label,
  value,
  dim,
}: {
  label: string;
  value: number;
  dim?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${dim ? "opacity-50" : ""}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-gray-900">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
