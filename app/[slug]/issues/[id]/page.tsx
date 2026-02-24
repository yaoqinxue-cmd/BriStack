import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";

interface IssueData {
  id: string;
  title: string;
  summary: string | null;
  key_points: string[] | null;
  topics: string[] | null;
  author_note: string | null;
  full_content_html: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  content_penetration_score: number | null;
}

interface CreatorInfo {
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
}

async function getIssue(id: string): Promise<IssueData | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${appUrl}/api/v1/issues/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCreator(slug: string): Promise<CreatorInfo | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${appUrl}/api/creator/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return { title: "Not Found" };
  return {
    title: issue.title,
    description: issue.summary || undefined,
    openGraph: { title: issue.title, description: issue.summary || undefined },
  };
}

export default async function PublicIssuePage(
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const [issue, creator] = await Promise.all([getIssue(id), getCreator(slug)]);

  if (!issue) notFound();

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link
          href={`/${slug}`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {creator?.name || slug}
        </Link>
        <Link
          href={`/${slug}#subscribe`}
          className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          订阅
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-6 flex-wrap">
          {issue.published_at && <span>{formatDate(issue.published_at)}</span>}
          {issue.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {issue.reading_time_minutes} 分钟阅读
            </span>
          )}
          {(issue.topics || []).map(t => (
            <span key={t} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-8">
          {issue.title}
        </h1>

        {/* Summary */}
        {issue.summary && (
          <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl px-5 py-4 mb-8">
            <p className="text-xs font-semibold text-indigo-600 mb-1.5 uppercase tracking-wide">AI 摘要</p>
            <p className="text-sm text-indigo-800 leading-relaxed">{issue.summary}</p>
          </div>
        )}

        {/* Key points */}
        {issue.key_points && issue.key_points.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-5 mb-8">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> 核心论点
            </p>
            <ul className="space-y-2">
              {issue.key_points.map((p, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-gray prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: issue.full_content_html || "" }}
        />

        {/* Author note */}
        {issue.author_note && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">作者注释</p>
            <p className="text-gray-600 italic leading-relaxed">{issue.author_note}</p>
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
          <p className="text-gray-700 font-semibold mb-1">喜欢这篇内容？</p>
          <p className="text-gray-500 text-sm mb-5">订阅 {creator?.name || slug}，第一时间收到新内容</p>
          <Link
            href={`/${slug}#subscribe`}
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            免费订阅
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p>Powered by <span className="font-medium text-gray-600">BriStack</span></p>
      </footer>
    </div>
  );
}
