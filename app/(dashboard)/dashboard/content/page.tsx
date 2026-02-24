"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, FileText, Clock, Trash2, ArchiveRestore, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Issue {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  publishedAt: string | null;
  contentPenetrationScore: number | null;
  readingTimeMinutes: number | null;
  topics: string[] | null;
  createdAt: string;
  targetChannels: string[];
}

interface WebsiteOption {
  id: string;
  name: string;
}

function ContentList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") || undefined;
  const channelFilter = searchParams.get("channel") || undefined;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const [issuesRes, sitesRes] = await Promise.all([
        fetch("/api/issues"),
        fetch("/api/settings/websites"),
      ]);
      const [issuesData, sitesData] = await Promise.all([issuesRes.json(), sitesRes.json()]);
      setIssues(Array.isArray(issuesData) ? issuesData : []);
      if (Array.isArray(sitesData)) setWebsites(sitesData.map((s: WebsiteOption) => ({ id: s.id, name: s.name })));
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const filtered = issues.filter(i => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (channelFilter) {
      const tc = i.targetChannels || [];
      // Empty targetChannels = visible on all channels
      if (tc.length > 0 && !tc.includes(channelFilter)) return false;
    }
    return true;
  });

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/issues/${id}`, { method: "DELETE" });
      setIssues(prev => prev.filter(i => i.id !== id));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUnpublish(id: string) {
    setUnpublishingId(id);
    try {
      await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      setIssues(prev => prev.map(i =>
        i.id === id ? { ...i, status: "draft", publishedAt: null } : i
      ));
    } finally {
      setUnpublishingId(null);
    }
  }

  function buildHref(status?: string, channel?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (channel) params.set("channel", channel);
    const q = params.toString();
    return `/dashboard/content${q ? `?${q}` : ""}`;
  }

  const channelTabs: { label: string; value: string }[] = [
    { label: "落地页", value: "landing_page" },
    { label: "邮件", value: "email" },
    ...websites.map(w => ({ label: w.name, value: w.id })),
  ];

  return (
    <>
      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { label: "全部", value: undefined },
          { label: "已发布", value: "published" },
          { label: "草稿", value: "draft" },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={buildHref(tab.value, channelFilter)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Channel filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-gray-400 mr-1">渠道：</span>
        <button
          onClick={() => router.push(buildHref(statusFilter, undefined))}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            !channelFilter ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          全部
        </button>
        {channelTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => router.push(buildHref(statusFilter, tab.value))}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              channelFilter === tab.value ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-4">
              {statusFilter
                ? `没有${statusFilter === "published" ? "已发布" : "草稿"}内容`
                : "还没有任何内容"}
            </p>
            <Link
              href="/dashboard/content/new"
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建第一篇内容
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-2 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                {/* Main clickable area */}
                <Link
                  href={`/dashboard/content/${issue.id}`}
                  className="flex flex-1 items-start gap-4 min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        issue.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {issue.status === "published" ? "已发布" : "草稿"}
                      </span>
                      {(issue.topics || []).slice(0, 3).map(t => (
                        <span key={t} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {issue.title}
                    </h3>
                    {issue.summary && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{issue.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs text-gray-400">
                    {issue.readingTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {issue.readingTimeMinutes}分钟
                      </span>
                    )}
                    {issue.contentPenetrationScore !== null && issue.contentPenetrationScore !== undefined && (
                      <span className={`font-medium ${
                        issue.contentPenetrationScore >= 70 ? "text-green-600"
                          : issue.contentPenetrationScore >= 40 ? "text-yellow-600"
                          : "text-red-500"
                      }`}>
                        穿透率 {Math.round(issue.contentPenetrationScore)}%
                      </span>
                    )}
                    <span>
                      {issue.status === "published"
                        ? formatDate(issue.publishedAt)
                        : formatDate(issue.createdAt)}
                    </span>
                  </div>
                </Link>

                {/* Action buttons — visible on row hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {issue.status === "published" && (
                    <button
                      onClick={() => handleUnpublish(issue.id)}
                      disabled={unpublishingId === issue.id}
                      title="撤回为草稿"
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {unpublishingId === issue.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArchiveRestore className="w-4 h-4" />}
                    </button>
                  )}

                  {confirmDeleteId === issue.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(issue.id)}
                        disabled={deletingId === issue.id}
                        className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                      >
                        {deletingId === issue.id ? "删除中…" : "确认删除"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(issue.id)}
                      title="删除"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ContentListPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">内容管理</h1>
        <Link
          href="/dashboard/content/new"
          className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建内容
        </Link>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      }>
        <ContentList />
      </Suspense>
    </div>
  );
}
