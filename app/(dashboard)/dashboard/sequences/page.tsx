"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Globe } from "lucide-react";

interface GlobalSettings {
  name: string;
  welcomeEmailEnabled: boolean;
  welcomeEmailSubject: string;
  welcomeEmailBody: string;
  greetingEmailEnabled: boolean;
  greetingDelayDays: number;
  greetingEmailSubject: string;
  greetingEmailBody: string;
}

interface WebsiteItem {
  id: string;
  name: string;
  url: string;
  embedKey: string;
  subscriberCount: number;
  welcomeEmailEnabled: boolean;
  welcomeEmailSubject: string | null;
  welcomeEmailBody: string | null;
}

export default function SequencesPage() {
  const [global, setGlobal] = useState<GlobalSettings>({
    name: "",
    welcomeEmailEnabled: true,
    welcomeEmailSubject: "",
    welcomeEmailBody: "",
    greetingEmailEnabled: false,
    greetingDelayDays: 3,
    greetingEmailSubject: "",
    greetingEmailBody: "",
  });
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [appUrl, setAppUrl] = useState("");

  // Save state per section
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<"idle" | "success" | "error">("idle");
  const [savingWebsite, setSavingWebsite] = useState<string | null>(null);
  const [websiteStatus, setWebsiteStatus] = useState<Record<string, "success" | "error">>({});

  // Collapse state for per-website cards
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (data) setGlobal(p => ({ ...p, ...data }));
      });
    fetch("/api/settings/websites")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWebsites(data.map(s => ({
            ...s,
            welcomeEmailEnabled: s.welcomeEmailEnabled ?? false,
            welcomeEmailSubject: s.welcomeEmailSubject ?? "",
            welcomeEmailBody: s.welcomeEmailBody ?? "",
          })));
        }
      });
    setAppUrl(window.location.origin);
  }, []);

  async function saveGlobal() {
    setSavingGlobal(true);
    setGlobalStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(global),
      });
      setGlobalStatus(res.ok ? "success" : "error");
    } catch {
      setGlobalStatus("error");
    }
    setSavingGlobal(false);
    setTimeout(() => setGlobalStatus("idle"), 3000);
  }

  async function saveWebsite(site: WebsiteItem) {
    setSavingWebsite(site.id);
    setWebsiteStatus(p => ({ ...p, [site.id]: undefined as unknown as "success" }));
    try {
      const res = await fetch(`/api/settings/websites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomeEmailEnabled: site.welcomeEmailEnabled,
          welcomeEmailSubject: site.welcomeEmailSubject || null,
          welcomeEmailBody: site.welcomeEmailBody || null,
        }),
      });
      setWebsiteStatus(p => ({ ...p, [site.id]: res.ok ? "success" : "error" }));
    } catch {
      setWebsiteStatus(p => ({ ...p, [site.id]: "error" }));
    }
    setSavingWebsite(null);
    setTimeout(() => setWebsiteStatus(p => { const n = { ...p }; delete n[site.id]; return n; }), 3000);
  }

  function updateWebsite(id: string, patch: Partial<WebsiteItem>) {
    setWebsites(p => p.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">触达邮件</h1>
        <p className="text-sm text-gray-400 mt-0.5">配置新订阅者加入后的自动化邮件序列，支持按订阅来源定制内容</p>
      </div>

      {/* 默认序列 - 落地页订阅者 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">默认序列</h2>
          <p className="text-xs text-gray-400 mt-0.5">适用于落地页订阅者，以及未单独配置欢迎邮件的外部网站</p>
        </div>

        {/* Step 1: Welcome email */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
            <div className="w-px flex-1 bg-gray-200 my-1 min-h-[24px]" />
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-700 text-sm">订阅即时 · 欢迎邮件</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={global.welcomeEmailEnabled}
                  onChange={e => setGlobal(p => ({ ...p, welcomeEmailEnabled: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">启用</span>
              </label>
            </div>
            {global.welcomeEmailEnabled && (
              <div className="space-y-3 border-l-2 border-indigo-100 pl-3">
                <Field label="邮件主题" hint="留空则使用默认，支持 {name} {creatorName}">
                  <input
                    type="text"
                    value={global.welcomeEmailSubject}
                    onChange={e => setGlobal(p => ({ ...p, welcomeEmailSubject: e.target.value }))}
                    className="input"
                    placeholder={`欢迎订阅 ${global.name || "我的 Space"}（默认）`}
                  />
                </Field>
                <Field label="邮件正文" hint="留空则使用默认模板，支持 {name} {creatorName}，每行为一段">
                  <textarea
                    value={global.welcomeEmailBody}
                    onChange={e => setGlobal(p => ({ ...p, welcomeEmailBody: e.target.value }))}
                    className="input resize-none"
                    rows={4}
                    placeholder={`嗨 {name}，\n\n感谢你订阅 {creatorName}！\n\n接下来我会定期给你发送深度内容，期待与你在文字中相遇。`}
                  />
                </Field>
                <p className="text-xs text-gray-400">留空则发送默认欢迎邮件（含 MCP 安装说明）</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Greeting email */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-700 text-sm">
                订阅后 {global.greetingDelayDays} 天 · 问候邮件
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={global.greetingEmailEnabled}
                  onChange={e => setGlobal(p => ({ ...p, greetingEmailEnabled: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">启用</span>
              </label>
            </div>
            {global.greetingEmailEnabled && (
              <div className="space-y-3 border-l-2 border-purple-100 pl-3">
                <Field label="发送时机">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={global.greetingDelayDays}
                      onChange={e => setGlobal(p => ({ ...p, greetingDelayDays: parseInt(e.target.value) || 3 }))}
                      className="input w-20"
                    />
                    <span className="text-sm text-gray-500">天后（订阅日期起算）</span>
                  </div>
                </Field>
                <Field label="邮件主题" hint="{name} {creatorName} 为变量">
                  <input
                    type="text"
                    value={global.greetingEmailSubject}
                    onChange={e => setGlobal(p => ({ ...p, greetingEmailSubject: e.target.value }))}
                    className="input"
                    placeholder="嗨 {name}，订阅几天了，感觉怎么样？"
                  />
                </Field>
                <Field label="邮件正文" hint="每行一段，{name} {creatorName} 为变量">
                  <textarea
                    value={global.greetingEmailBody}
                    onChange={e => setGlobal(p => ({ ...p, greetingEmailBody: e.target.value }))}
                    className="input resize-none"
                    rows={4}
                    placeholder={`嗨 {name}，\n\n你已经订阅 {creatorName} 几天了，希望你读到了一些有价值的内容。\n\n有任何想法，直接回复这封邮件就好。`}
                  />
                </Field>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-medium">需配置每日 Cron 触发：</p>
                  <code className="block bg-white rounded border border-amber-200 px-2 py-1 break-all">
                    GET {appUrl}/api/cron/greetings?secret=YOUR_CRON_SECRET
                  </code>
                  <p>环境变量设置 <code>CRON_SECRET=YOUR_CRON_SECRET</code></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          <button
            onClick={saveGlobal}
            disabled={savingGlobal}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {savingGlobal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {savingGlobal ? "保存中..." : "保存默认序列"}
          </button>
          {globalStatus === "success" && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已保存</span>}
          {globalStatus === "error" && <span className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />保存失败</span>}
        </div>
      </div>

      {/* Per-website welcome email overrides */}
      {websites.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">外部网站定制欢迎邮件</h2>
            <p className="text-xs text-gray-400 mt-0.5">为来自特定外部网站的新订阅者发送专属欢迎邮件，覆盖默认设置</p>
          </div>

          {websites.map(site => {
            const isExpanded = expanded[site.id] ?? false;
            const status = websiteStatus[site.id];

            return (
              <div key={site.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpanded(p => ({ ...p, [site.id]: !p[site.id] }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800">{site.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{site.subscriberCount} 位订阅者</span>
                        {site.welcomeEmailEnabled && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">已定制</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{site.url}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {/* Expanded config */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">定制欢迎邮件</p>
                        <p className="text-xs text-gray-400 mt-0.5">启用后将覆盖默认欢迎邮件，仅对该网站的新订阅者生效</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={site.welcomeEmailEnabled}
                          onChange={e => updateWebsite(site.id, { welcomeEmailEnabled: e.target.checked })}
                          className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-600">启用</span>
                      </label>
                    </div>

                    {site.welcomeEmailEnabled && (
                      <div className="space-y-3 border-l-2 border-indigo-100 pl-3">
                        <Field label="邮件主题" hint="留空则使用默认序列主题，支持 {name} {creatorName}">
                          <input
                            type="text"
                            value={site.welcomeEmailSubject ?? ""}
                            onChange={e => updateWebsite(site.id, { welcomeEmailSubject: e.target.value })}
                            className="input"
                            placeholder={`欢迎来自 ${site.name} 的订阅（留空使用默认主题）`}
                          />
                        </Field>
                        <Field label="邮件正文" hint="留空则使用默认序列正文，支持 {name} {creatorName}，每行为一段">
                          <textarea
                            value={site.welcomeEmailBody ?? ""}
                            onChange={e => updateWebsite(site.id, { welcomeEmailBody: e.target.value })}
                            className="input resize-none"
                            rows={4}
                            placeholder={`嗨 {name}，\n\n感谢你通过 ${site.name} 订阅！\n\n...`}
                          />
                        </Field>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => saveWebsite(site)}
                        disabled={savingWebsite === site.id}
                        className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                      >
                        {savingWebsite === site.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingWebsite === site.id ? "保存中..." : "保存"}
                      </button>
                      {status === "success" && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已保存</span>}
                      {status === "error" && <span className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />保存失败</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {websites.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          暂无外部网站。在「设置 → 我的外部网站」中添加后，可在此处为每个网站定制欢迎邮件。
        </div>
      )}

      <style jsx>{`
        .input{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;outline:none;transition:all 0.15s;}
        .input:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,0.15);}
        .input::placeholder{color:#9ca3af;}
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{hint && <span className="ml-1 text-xs text-gray-400 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
