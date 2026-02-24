"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Users, Loader2, CheckCircle, AlertCircle, Mail, Filter, X } from "lucide-react";
import Link from "next/link";

interface Issue {
  id: string;
  title: string;
  status: string;
}

interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  preview?: boolean;
  success?: boolean;
  error?: string;
}

export default function SendPage() {
  const params = useParams();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [humanCount, setHumanCount] = useState<number | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Send options
  const [previewEmail, setPreviewEmail] = useState("");
  const [filterLevel, setFilterLevel] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // State
  const [isSending, setIsSending] = useState(false);
  const [isPreviewSending, setIsPreviewSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [previewResult, setPreviewResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/issues/${issueId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setIssue(d); })
      .catch(() => {});
    fetch("/api/subscribers/stats")
      .then(async (r) => {
        if (!r.ok) return null;
        const text = await r.text();
        return text ? JSON.parse(text) : null;
      })
      .then((d) => {
        if (!d) return;
        setHumanCount(d.humanSubscribers ?? 0);
        setAllTags(d.tags ?? []);
      })
      .catch(() => {});
  }, [issueId]);

  async function handlePreviewSend() {
    if (!previewEmail) return;
    setIsPreviewSending(true);
    setPreviewResult(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewEmail }),
      });
      const data = await res.json();
      setPreviewResult({ success: data.success, error: data.error });
    } catch {
      setPreviewResult({ success: false, error: "网络错误" });
    }
    setIsPreviewSending(false);
  }

  async function handleSend() {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterLevel, filterTags }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setIsSending(false);
  }

  function toggleTag(tag: string) {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  if (!issue) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">加载中...</div>;
  }

  if (issue.status !== "published") {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <p className="text-gray-600">请先发布内容，再发送给订阅者</p>
        <Link href={`/dashboard/content/${issueId}`} className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
          返回编辑
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/content/${issueId}`} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">发送邮件</h1>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
        <span className="font-medium">发送内容：</span>{issue.title}
      </div>

      {/* Preview send */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          预览发送
        </h2>
        <p className="text-xs text-gray-400">发送一封预览邮件到指定地址，确认样式后再群发</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={previewEmail}
            onChange={(e) => setPreviewEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400"
          />
          <button
            onClick={handlePreviewSend}
            disabled={isPreviewSending || !previewEmail}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isPreviewSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            发送预览
          </button>
        </div>
        {previewResult && (
          <div className={`text-sm flex items-center gap-1.5 ${previewResult.success ? "text-green-600" : "text-red-500"}`}>
            {previewResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {previewResult.success ? "预览邮件已发送" : `发送失败：${previewResult.error}`}
          </div>
        )}
      </div>

      {/* Group filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          发送范围
        </h2>

        {/* Level filter */}
        <div>
          <p className="text-xs text-gray-500 mb-2">按关系等级筛选</p>
          <div className="flex flex-wrap gap-2">
            {(["all", 1, 2, 3, 4] as const).map((l) => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterLevel === l
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {l === "all" ? "全部等级" : `Level ${l}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">按标签筛选（不选则不限制标签）</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    filterTags.includes(tag)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-200 text-gray-600 hover:border-indigo-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {filterTags.length > 0 && (
              <button onClick={() => setFilterTags([])} className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1">
                <X className="w-3 h-3" /> 清除标签筛选
              </button>
            )}
          </div>
        )}

        {/* Audience estimate */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            预计发送给 <span className="font-semibold text-gray-900">{humanCount ?? "..."}</span> 位活跃人类订阅者
            {(filterLevel !== "all" || filterTags.length > 0) && (
              <span className="text-gray-400">（实际数量以筛选为准）</span>
            )}
          </div>
        </div>
      </div>

      {/* Send result */}
      {result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">发送完成！</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-600">{result.sent}</div>
              <div className="text-xs text-gray-500">成功</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xl font-bold text-gray-400">{result.skipped}</div>
              <div className="text-xs text-gray-500">已跳过</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xl font-bold text-red-500">{result.failed}</div>
              <div className="text-xs text-gray-500">失败</div>
            </div>
          </div>
          <Link href="/dashboard/analytics" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
            查看发送分析 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}
                {(error.includes("SMTP") || error.includes("邮件服务")) && (
                  <Link href="/dashboard/settings" className="underline ml-1">配置邮件服务</Link>
                )}
              </span>
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isSending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />发送中，请勿关闭页面...</>
            ) : (
              <><Send className="w-4 h-4" />确认群发</>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center">每篇内容只发送一次，已收到的订阅者自动跳过</p>
        </div>
      )}
    </div>
  );
}
