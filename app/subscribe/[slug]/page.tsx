"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface CreatorInfo {
  name: string;
  slug: string;
  bio: string | null;
}

export default function SubscribePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/creator/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setCreator(data);
      });
  }, [slug]);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, creatorSlug: slug }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setError(data.error || "订阅失败，请重试");
        setStatus("error");
      }
    } catch {
      setError("网络错误，请重试");
      setStatus("error");
    }

    setIsSubmitting(false);
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {status === "success" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">订阅成功！</h2>
            <p className="text-gray-500 text-sm">
              欢迎加入 <strong>{creator.name}</strong>！
              请检查你的邮箱，一封欢迎邮件已经发送出去了。
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{creator.name}</h1>
              {creator.bio && (
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  {creator.bio}
                </p>
              )}
            </div>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱地址 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  你的名字 <span className="text-gray-400 font-normal">（可选）</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "订阅中..." : "订阅"}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-5">
              随时可以取消订阅 · 不会收到垃圾邮件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
