"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X, Plus, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  level: number;
  tags: string[];
  notes: string | null;
  subscribedAt: string;
  lastActivityAt: string;
}

export default function SubscriberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sub, setSub] = useState<Subscriber | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [level, setLevel] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/subscribers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSub(data);
          setTags(data.tags || []);
          setNotes(data.notes || "");
          setLevel(data.level || 1);
        }
        setLoading(false);
      });
  }, [id]);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags, notes, level }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>;
  if (!sub) return <div className="text-center py-20 text-gray-400 text-sm">订阅者不存在</div>;

  const levelLabels: Record<number, string> = { 1: "Level 1 - 普通读者", 2: "Level 2 - 活跃读者", 3: "Level 3 - 忠实粉丝", 4: "Level 4 - 核心伙伴" };

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/subscribers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">订阅者详情</h1>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">基本信息</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs">邮箱</span>
            <p className="text-gray-800 font-medium">{sub.email}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">姓名</span>
            <p className="text-gray-800">{sub.name || "—"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">状态</span>
            <p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {sub.status === "active" ? "活跃" : "已退订"}
              </span>
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">订阅时间</span>
            <p className="text-gray-600 text-xs">{formatDate(new Date(sub.subscribedAt))}</p>
          </div>
        </div>
      </div>

      {/* Level */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">关系等级</h2>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`text-sm px-3 py-2 rounded-lg border text-left transition-colors ${
                level === l
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {levelLabels[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">标签</h2>
        <div className="flex flex-wrap gap-2 min-h-8">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              {tag}
              <button onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-indigo-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入标签（Enter 或逗号确认）"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400"
          />
          <button
            onClick={addTag}
            className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-3.5 h-3.5" />
            添加
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">私人备注</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="关于这位订阅者的私人笔记..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isSaving ? "保存中..." : "保存"}
        </button>
        {saved && <span className="text-sm text-green-600">已保存</span>}
      </div>
    </div>
  );
}
