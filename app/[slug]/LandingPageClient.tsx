"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Users, BookOpen, Zap, Bot, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface IssuePreview {
  id: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  topics: string[] | null;
  readingTimeMinutes: number | null;
  publishedAt: string | null;
  coverImage: string | null;
}

interface CreatorData {
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  subscriberCount: number;
  issueCount: number;
  recentIssues: IssuePreview[];
  mcpUrl: string;
  apiUrl: string;
}

export default function LandingPageClient({ data }: { data: CreatorData }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, creatorSlug: data.slug }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setErrorMsg(result.error || "订阅失败，请重试");
      }
    } catch {
      setStatus("error");
      setErrorMsg("网络错误，请重试");
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  }

  const allTopics = Array.from(new Set(data.recentIssues.flatMap(i => i.topics || []))).slice(0, 12);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <span className="font-bold text-gray-900">{data.name}</span>
        <a
          href="#subscribe"
          className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          订阅
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data.name}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-gray-100"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {data.name[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{data.name}</h1>
            {data.bio && <p className="text-gray-600 text-lg leading-relaxed mb-5">{data.bio}</p>}

            {/* Stats */}
            <div className="flex flex-wrap gap-5 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span><strong className="text-gray-900">{data.subscriberCount}</strong> 位订阅者</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span><strong className="text-gray-900">{data.issueCount}</strong> 篇内容</span>
              </div>
              {allTopics.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">话题：</span>
                  {allTopics.slice(0, 4).map(t => (
                    <span key={t} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{t}</span>
                  ))}
                  {allTopics.length > 4 && <span className="text-gray-400 text-xs">+{allTopics.length - 4}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe form */}
      <section id="subscribe" className="bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">订阅 {data.name}</h2>
          <p className="text-gray-500 text-sm mb-6">
            每期内容经过 AI 穿透率优化，无论你是直接阅读还是通过 AI 助手获取，核心观点都能完整传达。
          </p>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-xl p-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">订阅成功！欢迎加入</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字（可选）"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-white"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "订阅中..." : "免费订阅"}
              </button>
              {status === "error" && (
                <div className="flex items-center justify-center gap-1.5 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Recent issues */}
      {data.recentIssues.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">最新内容</h2>
          <div className="space-y-0 divide-y divide-gray-100">
            {data.recentIssues.map((issue) => (
              <Link key={issue.id} href={`/${data.slug}/issues/${issue.id}`} className="block group">
                <article className="py-6">
                  <div className="flex gap-5">
                    {issue.coverImage && (
                      <img
                        src={issue.coverImage}
                        alt={issue.title}
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {issue.title}
                          </h3>
                          {issue.subtitle && (
                            <p className="text-gray-500 text-sm mt-0.5">{issue.subtitle}</p>
                          )}
                          {issue.summary && (
                            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{issue.summary}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-1 transition-colors" />
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        {issue.publishedAt && <span>{formatDate(issue.publishedAt)}</span>}
                        {issue.readingTimeMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {issue.readingTimeMinutes} 分钟
                          </span>
                        )}
                        {(issue.topics || []).slice(0, 3).map(t => (
                          <span key={t} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI-era section */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wide">
              AI-Native
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">这个 Space 为 AI 时代而设计</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-2xl">
            每篇内容都包含结构化摘要和核心论点，无论通过邮件阅读、AI 助手检索还是 API 调用，信息都能完整传达。
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">直接订阅</h3>
              <p className="text-xs text-gray-400">每期内容直达你的邮箱，包含 AI 优化摘要，忙碌时快速获取精华。</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">MCP 接入</h3>
              <p className="text-xs text-gray-400 mb-2">
                在 Claude Desktop 中直接检索内容，让 AI 助手帮你找到相关观点。
              </p>
              <code className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded block break-all">
                {data.mcpUrl}
              </code>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">开放 API</h3>
              <p className="text-xs text-gray-400 mb-2">
                通过 REST API 订阅并获取内容，集成到你的工作流或 AI 应用中。
              </p>
              <code className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded block break-all">
                {data.apiUrl}/feed
              </code>
            </div>
          </div>

          {/* MCP setup hint */}
          <div className="mt-6 bg-white rounded-xl border border-indigo-100 p-4">
            <p className="text-xs font-medium text-indigo-700 mb-2">Claude Desktop 接入示例</p>
            <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto">{`{
  "mcpServers": {
    "${data.slug}": {
      "url": "${data.mcpUrl}",
      "headers": { "x-creator-slug": "${data.slug}" }
    }
  }
}`}</pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>
          Powered by <span className="font-medium text-gray-600">BriStack</span>
          {" · "}
          <a href={`/${data.slug}`} className="hover:text-gray-600">首页</a>
        </p>
      </footer>
    </div>
  );
}
