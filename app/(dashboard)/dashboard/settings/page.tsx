"use client";

import { useState, useEffect } from "react";
import { Save, TestTube, CheckCircle, AlertCircle, Loader2, ExternalLink, Plus, Trash2, Copy, Globe } from "lucide-react";

interface SettingsData {
  name: string; slug: string; bio: string; avatarUrl: string;
  fromName: string; fromEmail: string;
  emailProvider: "smtp" | "resend";
  smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpUser: string; smtpPass: string;
  resendApiKey: string; anthropicApiKey: string;
}

interface WebsiteItem {
  id: string; name: string; url: string; embedKey: string; createdAt: string; subscriberCount: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    name: "", slug: "", bio: "", avatarUrl: "",
    fromName: "", fromEmail: "", emailProvider: "smtp",
    smtpHost: "", smtpPort: 587, smtpSecure: false, smtpUser: "", smtpPass: "",
    resendApiKey: "", anthropicApiKey: "",
  });
  const [landingPageSubscriberCount, setLandingPageSubscriberCount] = useState(0);
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data) {
        setSettings(p => ({ ...p, ...data }));
        if (typeof data.landingPageSubscriberCount === "number") {
          setLandingPageSubscriberCount(data.landingPageSubscriberCount);
        }
      }
    });
    fetch("/api/settings/websites").then(r => r.json()).then(data => { if (Array.isArray(data)) setWebsites(data); });
    setAppUrl(window.location.origin);
  }, []);

  async function handleSave() {
    setIsSaving(true); setSaveStatus("idle");
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      setSaveStatus(res.ok ? "success" : "error");
    } catch { setSaveStatus("error"); }
    setIsSaving(false);
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  async function handleTest() {
    setIsTesting(true); setTestStatus("idle"); setTestError("");
    try {
      const ep = settings.emailProvider === "resend" ? "/api/settings/test-resend" : "/api/settings/test-smtp";
      const body = settings.emailProvider === "resend"
        ? { apiKey: settings.resendApiKey }
        : { host: settings.smtpHost, port: settings.smtpPort, secure: settings.smtpSecure, user: settings.smtpUser, pass: settings.smtpPass };
      const data = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
      setTestStatus(data.success ? "success" : "error");
      setTestError(data.error || "");
    } catch { setTestStatus("error"); setTestError("网络错误"); }
    setIsTesting(false);
  }

  async function handleAddSite() {
    if (!newSiteName.trim() || !newSiteUrl.trim()) return;
    setIsAddingSite(true);
    try {
      const site = await fetch("/api/settings/websites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSiteName, url: newSiteUrl }) }).then(r => r.json());
      if (site.id) { setWebsites(p => [site, ...p]); setNewSiteName(""); setNewSiteUrl(""); }
    } finally { setIsAddingSite(false); }
  }

  async function handleDeleteSite(id: string) {
    await fetch(`/api/settings/websites/${id}`, { method: "DELETE" });
    setWebsites(p => p.filter(s => s.id !== id));
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  }

  const embedCode = (key: string) => `<iframe src="${appUrl}/embed/${key}" width="100%" height="180" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">设置</h1>

      {/* 落地页设置 */}
      <Section
        title="落地页设置"
        hint={settings.slug ? `${appUrl}/${settings.slug}` : "配置 Slug 后生成公开落地页"}
        badge={`${landingPageSubscriberCount} 位订阅者`}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Space 名称">
            <input type="text" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="input" placeholder="我的 Space" />
          </Field>
          <Field label="URL Slug">
            <input type="text" value={settings.slug} onChange={e => setSettings({ ...settings, slug: e.target.value })} className="input" placeholder="my-newsletter" />
          </Field>
        </div>
        <Field label="简介">
          <textarea value={settings.bio} onChange={e => setSettings({ ...settings, bio: e.target.value })} className="input resize-none" rows={2} placeholder="这个 Space 是关于..." />
        </Field>
        <Field label="创作者头像 URL" hint="显示在落地页">
          <input type="url" value={settings.avatarUrl} onChange={e => setSettings({ ...settings, avatarUrl: e.target.value })} className="input" placeholder="https://example.com/avatar.jpg" />
        </Field>
        {settings.slug && (
          <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 text-sm">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <a href={`/${settings.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-sm">
              {appUrl}/{settings.slug} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </Section>

      {/* 我的外部网站 */}
      <Section title="我的外部网站" hint="为每个外部网站生成嵌入代码，自动追踪订阅来源">
        <p className="text-xs text-gray-400">创作者自己维护的外部网站（博客、官网等），添加后获取嵌入代码，放入网站即可直接收集订阅者，并自动标记来源。</p>

        {websites.map(site => (
          <div key={site.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-800">{site.name}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{site.subscriberCount ?? 0} 位订阅者</span>
                </div>
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1">
                  {site.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button onClick={() => handleDeleteSite(site.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5">嵌入代码</p>
              <div className="relative bg-gray-50 rounded-lg border border-gray-200">
                <pre className="text-xs text-gray-600 px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all pr-10">{embedCode(site.embedKey)}</pre>
                <button onClick={() => copy(embedCode(site.embedKey), site.id)} className="absolute top-2 right-2 bg-white border border-gray-200 rounded-md p-1 text-gray-400 hover:text-gray-600">
                  {copied === site.id ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5">嵌入预览</p>
              <iframe src={`/embed/${site.embedKey}`} width="100%" height="160" frameBorder="0" className="rounded-lg border border-gray-200" />
            </div>
          </div>
        ))}

        <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">添加网站</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} placeholder="网站名称（如：我的博客）" className="input text-sm" />
            <input type="url" value={newSiteUrl} onChange={e => setNewSiteUrl(e.target.value)} placeholder="https://myblog.com" className="input text-sm" />
          </div>
          <button onClick={handleAddSite} disabled={isAddingSite || !newSiteName || !newSiteUrl}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {isAddingSite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            添加网站
          </button>
        </div>
      </Section>

      {/* 邮件发送服务 */}
      <Section title="邮件发送服务">
        <div className="flex gap-2">
          {(["smtp", "resend"] as const).map(p => (
            <button key={p} onClick={() => setSettings({ ...settings, emailProvider: p })}
              className={`flex-1 text-sm px-4 py-2.5 rounded-lg border transition-colors ${settings.emailProvider === p ? (p === "resend" ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-900 text-white border-gray-900") : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {p === "smtp" ? "SMTP（自建/Gmail）" : "Resend（推荐）"}
            </button>
          ))}
        </div>
        {settings.emailProvider === "resend" ? (
          <Field label="Resend API Key">
            <input type="password" value={settings.resendApiKey} onChange={e => setSettings({ ...settings, resendApiKey: e.target.value })} className="input" placeholder="re_xxxxxxxxxxxx" />
          </Field>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SMTP 服务器"><input type="text" value={settings.smtpHost} onChange={e => setSettings({ ...settings, smtpHost: e.target.value })} className="input" placeholder="smtp.gmail.com" /></Field>
              <Field label="端口"><input type="number" value={settings.smtpPort} onChange={e => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })} className="input" placeholder="587" /></Field>
            </div>
            <Field label="SMTP 用户名"><input type="text" value={settings.smtpUser} onChange={e => setSettings({ ...settings, smtpUser: e.target.value })} className="input" placeholder="your@email.com" /></Field>
            <Field label="SMTP 密码"><input type="password" value={settings.smtpPass} onChange={e => setSettings({ ...settings, smtpPass: e.target.value })} className="input" placeholder="应用专用密码" /></Field>
          </>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="发件人名称"><input type="text" value={settings.fromName} onChange={e => setSettings({ ...settings, fromName: e.target.value })} className="input" placeholder="Space 名称" /></Field>
          <Field label="发件人邮箱"><input type="email" value={settings.fromEmail} onChange={e => setSettings({ ...settings, fromEmail: e.target.value })} className="input" placeholder="noreply@example.com" /></Field>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleTest} disabled={isTesting || (settings.emailProvider === "smtp" ? !settings.smtpHost : !settings.resendApiKey)}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}测试连接
          </button>
          {testStatus === "success" && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />连接成功</span>}
          {testStatus === "error" && <span className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{testError}</span>}
        </div>
      </Section>

      {/* AI 配置 */}
      <Section title="AI 功能配置">
        <Field label="Anthropic API Key" hint="用于内容穿透率评分和自动摘要">
          <input type="password" value={settings.anthropicApiKey} onChange={e => setSettings({ ...settings, anthropicApiKey: e.target.value })} className="input" placeholder="sk-ant-api03-..." />
        </Field>
        <p className="text-xs text-gray-400">不配置时 AI 功能不可用，每次发布约消耗 $0.01。</p>
      </Section>

      {/* MCP */}
      <Section title="MCP Server 配置">
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <p className="text-gray-600 mb-3">将以下配置添加到 Claude Desktop，让 AI 直接检索你的内容：</p>
          <pre className="bg-white border border-gray-200 rounded-md p-3 text-xs text-gray-700 overflow-x-auto">
{`{
  "mcpServers": {
    "${settings.slug || "your-newsletter"}": {
      "url": "${appUrl}/api/mcp",
      "headers": {
        "x-creator-slug": "${settings.slug || "your-newsletter"}"
      }
    }
  }
}`}
          </pre>
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isSaving ? "保存中..." : "保存设置"}
        </button>
        {saveStatus === "success" && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已保存</span>}
        {saveStatus === "error" && <span className="text-sm text-red-500">保存失败，请重试</span>}
      </div>

      <style jsx>{`
        .input{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;outline:none;transition:all 0.15s;}
        .input:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,0.15);}
        .input::placeholder{color:#9ca3af;}
      `}</style>
    </div>
  );
}

function Section({ title, hint, badge, children }: { title: string; hint?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
        {badge && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">{badge}</span>
        )}
      </div>
      {children}
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
