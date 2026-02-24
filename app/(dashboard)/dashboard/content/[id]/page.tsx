"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { StructuredEditor } from "@/components/editor/StructuredEditor";
import { ArrowLeft, Send, Eye, Edit3, Clock, BookOpen } from "lucide-react";
import Link from "next/link";

interface Issue {
  id: string;
  title: string;
  subtitle: string | null;
  coverImage: string | null;
  fullHtml: string;
  fullMarkdown: string;
  summary: string | null;
  keyPoints: string[];
  topics: string[];
  authorNote: string | null;
  humanWritten: boolean;
  readingTimeMinutes: number | null;
  status: string;
  contentPenetrationScore: number | null;
  publishedAt: string | null;
  targetChannels: string[];
}

interface WebsiteOption {
  id: string;
  name: string;
}

interface PenetrationData {
  score: number;
  aiSummary: string;
  preservedPoints: string[];
  lostPoints: string[];
  suggestions: string[];
}

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [penetrationData, setPenetrationData] = useState<PenetrationData | null>(null);
  const [showPenetration, setShowPenetration] = useState(false);
  const [mode, setMode] = useState<"edit" | "view">("edit");

  useEffect(() => {
    Promise.all([
      fetch(`/api/issues/${issueId}`).then(r => r.json()),
      fetch("/api/settings/websites").then(r => r.json()),
    ]).then(([issueData, sitesData]) => {
      setIssue(issueData);
      if (Array.isArray(sitesData)) setWebsites(sitesData.map((s: WebsiteOption) => ({ id: s.id, name: s.name })));
      setLoading(false);
    });
  }, [issueId]);

  async function handleSave(data: {
    title: string;
    subtitle: string;
    coverImage: string;
    content: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    authorNote: string;
    humanWritten: boolean;
    targetChannels: string[];
  }) {
    setIsSaving(true);
    try {
      await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setIssue((prev) =>
        prev ? { ...prev, ...data, fullHtml: data.content } : null
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish(data: {
    title: string;
    subtitle: string;
    coverImage: string;
    content: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    authorNote: string;
    humanWritten: boolean;
    targetChannels: string[];
  }) {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.penetration) {
        setPenetrationData(result.penetration);
        setShowPenetration(true);
      }
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              ...data,
              status: "published",
              contentPenetrationScore: result.penetration?.score ?? null,
            }
          : null
      );
    } finally {
      setIsPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        加载中...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-20 text-gray-400">内容不存在</div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/content"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {issue.title || "无标题"}
            </h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                issue.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {issue.status === "published" ? "已发布" : "草稿"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${mode === "edit" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Edit3 className="w-3.5 h-3.5" /> 编辑
            </button>
            <button
              onClick={() => setMode("view")}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${mode === "view" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Eye className="w-3.5 h-3.5" /> 浏览
            </button>
          </div>
          {issue.status === "published" && (
            <Link
              href={`/dashboard/content/${issueId}/send`}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              发送给订阅者
            </Link>
          )}
        </div>
      </div>

      {/* Penetration Score Result */}
      {showPenetration && penetrationData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-indigo-900">内容穿透率评分</h3>
            <button
              onClick={() => setShowPenetration(false)}
              className="text-indigo-400 hover:text-indigo-600 text-sm"
            >
              关闭
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className={`text-3xl font-bold ${
                penetrationData.score >= 70
                  ? "text-green-600"
                  : penetrationData.score >= 40
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {penetrationData.score}%
            </div>
            <div className="text-sm text-indigo-700">
              {penetrationData.score >= 70
                ? "优秀！核心论点大多能穿透 AI 摘要层"
                : penetrationData.score >= 40
                ? "一般，部分核心论点可能被 AI 摘要遗漏"
                : "较弱，建议加强论点的明确表达"}
            </div>
          </div>

          {penetrationData.lostPoints.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-red-600 mb-1">
                以下论点在 AI 摘要中被丢失：
              </p>
              {penetrationData.lostPoints.map((p, i) => (
                <p key={i} className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded mb-1">
                  {p}
                </p>
              ))}
            </div>
          )}

          {penetrationData.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-indigo-700 mb-1">改进建议：</p>
              {penetrationData.suggestions.map((s, i) => (
                <p key={i} className="text-xs text-indigo-600 mb-0.5">
                  · {s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "view" ? (
        <div className="max-w-2xl space-y-6">
          {/* Cover */}
          {issue.coverImage && (
            <img src={issue.coverImage} alt={issue.title} className="w-full h-56 object-cover rounded-xl" />
          )}
          {/* Title block */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{issue.title}</h1>
            {issue.subtitle && <p className="text-lg text-gray-500 mt-2">{issue.subtitle}</p>}
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
              {issue.publishedAt && (
                <span>{new Date(issue.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
              )}
              {issue.readingTimeMinutes && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{issue.readingTimeMinutes} 分钟</span>
              )}
              {(issue.topics || []).map(t => (
                <span key={t} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          {/* Summary */}
          {issue.summary && (
            <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl px-4 py-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">AI 摘要</p>
              <p className="text-sm text-indigo-800 leading-relaxed">{issue.summary}</p>
            </div>
          )}
          {/* Key points */}
          {issue.keyPoints && issue.keyPoints.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> 核心论点
              </p>
              <ul className="space-y-1">
                {issue.keyPoints.map((p, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Body */}
          <div
            className="prose prose-gray max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: issue.fullHtml || "" }}
          />
          {/* Author note */}
          {issue.authorNote && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">作者注释</p>
              <p className="text-sm text-gray-600 italic leading-relaxed">{issue.authorNote}</p>
            </div>
          )}
          {/* Penetration score */}
          {issue.contentPenetrationScore !== null && (
            <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
              <span>内容穿透率：</span>
              <span className={`font-bold ${issue.contentPenetrationScore >= 70 ? "text-green-600" : issue.contentPenetrationScore >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                {issue.contentPenetrationScore}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <StructuredEditor
          initialTitle={issue.title}
          initialSubtitle={issue.subtitle || ""}
          initialCoverImage={issue.coverImage || ""}
          initialContent={issue.fullHtml || ""}
          initialSummary={issue.summary || ""}
          initialKeyPoints={issue.keyPoints || []}
          initialTopics={issue.topics || []}
          initialAuthorNote={issue.authorNote || ""}
          initialHumanWritten={issue.humanWritten}
          initialTargetChannels={issue.targetChannels || []}
          websites={websites}
          onSave={handleSave}
          onPublish={issue.status !== "published" ? handlePublish : undefined}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isPublished={issue.status === "published"}
        />
      )}
    </div>
  );
}
