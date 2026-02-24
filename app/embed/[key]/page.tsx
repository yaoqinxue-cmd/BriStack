"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle } from "lucide-react";

export default function EmbedPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const [displayName, setDisplayName] = useState("Space");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/embed/${key}`)
      .then(r => r.json())
      .then(data => {
        setDisplayName(data.websiteName || data.displayName || "Space");
      })
      .catch(() => {});
  }, [key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, embedKey: key }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "订阅失败");
      }
    } catch {
      setStatus("error");
      setErrorMsg("网络错误");
    }
  }

  return (
    <div style={{
      margin: 0,
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "transparent",
      minHeight: "100%",
    }}>
      <div style={{
        padding: "20px",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        maxWidth: "400px",
        margin: "0 auto",
      }}>
        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "12px 0", color: "#16a34a" }}>
            <CheckCircle style={{ width: 28, height: 28, margin: "0 auto 8px", display: "block" }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>订阅成功！</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>感谢订阅 {displayName}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "#111827" }}>
              订阅 {displayName}
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名字（可选）"
              style={{
                display: "block", width: "100%", padding: "9px 12px",
                border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14,
                marginBottom: 8, boxSizing: "border-box", outline: "none",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                display: "block", width: "100%", padding: "9px 12px",
                border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14,
                marginBottom: 10, boxSizing: "border-box", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                display: "block", width: "100%", padding: "10px",
                background: "#111827", color: "#fff", border: "none",
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: "pointer", opacity: status === "loading" ? 0.6 : 1,
              }}
            >
              {status === "loading" ? "订阅中..." : "免费订阅"}
            </button>
            {status === "error" && (
              <p style={{ margin: "8px 0 0", color: "#ef4444", fontSize: 12 }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}
        <p style={{ margin: "12px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
          Powered by BriStack
        </p>
      </div>
    </div>
  );
}
