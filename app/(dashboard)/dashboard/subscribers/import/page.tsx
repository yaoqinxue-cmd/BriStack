"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParsedRow {
  email: string;
  name?: string;
  tags?: string;
}

export default function ImportSubscribersPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number; errors: string[] } | null>(null);

  function handleFile(file: File) {
    setParseError("");
    setRows([]);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSV(text);
        setRows(parsed);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "解析失败");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV 至少需要表头行和一行数据");
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIdx = header.indexOf("email");
    if (emailIdx === -1) throw new Error("CSV 必须包含 email 列");
    const nameIdx = header.indexOf("name");
    const tagsIdx = header.indexOf("tags");

    return lines.slice(1).map((line) => {
      const cols = line.split(",");
      return {
        email: cols[emailIdx]?.trim() || "",
        name: nameIdx >= 0 ? cols[nameIdx]?.trim() : undefined,
        tags: tagsIdx >= 0 ? cols[tagsIdx]?.trim() : undefined,
      };
    }).filter((r) => r.email);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setIsImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/subscribers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setResult(data);
      if (data.imported > 0) {
        setTimeout(() => router.push("/dashboard/subscribers"), 2000);
      }
    } catch {
      setResult({ imported: 0, skipped: 0, failed: rows.length, errors: ["网络错误"] });
    }
    setIsImporting(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/subscribers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">导入订阅者</h1>
      </div>

      {/* Template hint */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">CSV 格式要求：</p>
        <code className="block bg-white rounded border border-blue-200 px-3 py-2 text-xs text-gray-700">
          email,name,tags<br />
          alice@example.com,Alice,vip,reader<br />
          bob@example.com,Bob,
        </code>
        <p className="mt-2 text-xs text-blue-600">必须包含 email 列；name 和 tags 为可选；tags 用英文逗号分隔多个标签。</p>
      </div>

      {/* File drop */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-indigo-300 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">点击选择或拖拽 CSV 文件</p>
        <p className="text-xs text-gray-400 mt-1">支持 UTF-8 编码</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          {parseError}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && !result && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">预览（共 {rows.length} 行）</span>
          </div>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">Email</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">姓名</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">标签</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-4 py-2 text-gray-700">{r.email}</td>
                    <td className="px-4 py-2 text-gray-500">{r.name || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{r.tags || "—"}</td>
                  </tr>
                ))}
                {rows.length > 50 && (
                  <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 text-center">... 还有 {rows.length - 50} 行</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {isImporting ? "导入中..." : `开始导入 ${rows.length} 位订阅者`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-4 ${result.failed > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">导入完成</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div className="bg-white rounded-lg p-2">
              <div className="text-xl font-bold text-green-600">{result.imported}</div>
              <div className="text-xs text-gray-500">成功导入</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="text-xl font-bold text-gray-400">{result.skipped}</div>
              <div className="text-xs text-gray-500">已存在跳过</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="text-xl font-bold text-red-500">{result.failed}</div>
              <div className="text-xs text-gray-500">失败</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <ul className="text-xs text-red-500 space-y-0.5">
              {result.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
          {result.imported > 0 && (
            <p className="text-xs text-green-600 mt-2">正在跳转回订阅者列表...</p>
          )}
        </div>
      )}
    </div>
  );
}
