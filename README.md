# BriStack

> **AI-native content distribution platform** — publish once, reach humans via email, AI Agents via API, and LLM clients via MCP.
>
> **AI 原生内容分发平台** — 一次发布，同时触达邮件订阅者、AI Agent（API）和 LLM 客户端（MCP）。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaoqinxue-cmd/BriStack&env=DATABASE_URL,SESSION_SECRET,ADMIN_PASSWORD_HASH,NEXT_PUBLIC_APP_URL&project-name=bristack&repository-name=bristack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)

---

## What is BriStack? / 什么是 BriStack？

Most newsletter tools are built for the email era. BriStack is built for what comes next.

When someone subscribes, they may be a human reading on their phone — or an AI agent processing your content at 3 AM. BriStack serves both, without compromise:

- **Humans** get beautifully formatted emails with AI-powered summaries
- **AI Agents** get structured JSON via a clean REST API
- **LLM clients** (Claude, Cursor, etc.) get a full MCP server to query your content in real-time

All from a single publish action.

---

大多数 Newsletter 工具为邮件时代而生。BriStack 为接下来的时代而生。

当有人订阅时，他们可能是用手机阅读的真实用户，也可能是凌晨 3 点处理你内容的 AI Agent。BriStack 两者都服务，互不妥协：

- **真实读者** 收到格式精美、含 AI 摘要的邮件
- **AI Agent** 通过简洁的 REST API 获取结构化 JSON
- **LLM 客户端**（Claude、Cursor 等）通过完整的 MCP 服务器实时检索内容

一次发布，全部触达。

---

## Key Features / 核心功能

### Content / 内容

- **Structured editor** — title, subtitle, cover, rich body, AI summary, key points, topics, author note
- **Content Penetration Score** — measures how well your key arguments survive AI summarization (0–100)
- **Channel visibility control** — publish to landing page, email, or specific external websites independently
- **Browse mode** — preview exactly how readers see the final article

---

- **结构化编辑器** — 标题、副标题、封面、富文本正文、AI 摘要、核心论点、话题标签、作者注释
- **内容穿透率评分** — 衡量核心论点在 AI 压缩摘要中的保留率（0–100 分）
- **渠道可见性控制** — 可独立控制内容在落地页、邮件、各外部网站的可见性
- **浏览模式** — 精准预览读者看到的最终呈现效果

---

### Distribution / 分发

- **Email** — Nodemailer/Resend SMTP, batched delivery, open tracking pixel
- **JSON Feed** (`/api/v1/feed`) — RSS-compatible, AI-optimized with key points and structured metadata
- **MCP Server** (`/api/mcp`) — plug your Space into Claude Desktop or Cursor as a tool
- **Public REST API** — `GET /api/v1/issues/:id`, `GET /api/v1/search?q=...`

---

- **邮件** — Nodemailer/Resend SMTP，批量投递，打开追踪像素
- **JSON Feed** (`/api/v1/feed`) — 兼容 RSS，含核心论点和结构化元数据，AI 友好
- **MCP Server** (`/api/mcp`) — 将 Space 接入 Claude Desktop 或 Cursor 作为工具
- **公开 REST API** — `GET /api/v1/issues/:id`，`GET /api/v1/search?q=...`

---

### Subscribers / 订阅者

- **Three subscriber types**: Human (email) / Agent (API key) / MCP
- **Source tracking** — know exactly which landing page or embed widget each subscriber came from
- **Subscriber sequences** — welcome email + configurable delayed greeting email
- **Level system** — automatic upgrade from Level 1 (subscribed) to Level 4 (core audience)

---

- **三类订阅者**：人类（邮件）/ Agent（API Key）/ MCP
- **来源追踪** — 精准知道每个订阅者来自哪个落地页或嵌入表单
- **订阅序列** — 欢迎邮件 + 可配置延迟的问候邮件
- **等级系统** — 从 Level 1（已订阅）到 Level 4（核心圈子）自动升级

---

### Analytics / 数据分析

- **Dual-track dashboard** — human engagement vs. AI/bot traffic, strictly separated
- **Bot detection** — UA fingerprinting + behavior heuristics (GPTBot, ClaudeBot, etc.)
- **Per-channel subscriber counts** — landing page vs. each external website

---

- **双轨分析仪表盘** — 人类互动与 AI/Bot 流量严格分离
- **Bot 识别** — UA 指纹 + 行为特征（GPTBot、ClaudeBot 等）
- **各渠道订阅者数** — 落地页与各外部网站独立统计

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, full-stack) |
| Language | TypeScript |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Auth | iron-session (password-based) |
| Email | Nodemailer + react-email |
| Editor | Tiptap (rich text) |
| AI | Anthropic SDK (Claude Haiku) |
| MCP | `@modelcontextprotocol/sdk` |
| Bot detection | `isbot` |
| Styling | Tailwind CSS |

---

## Quick Start / 快速开始

### Prerequisites / 前置条件
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works) / 一个 [Neon](https://neon.tech) PostgreSQL 数据库（免费套餐即可）
- An SMTP provider or [Resend](https://resend.com) account / SMTP 邮件服务商或 [Resend](https://resend.com) 账户

### 1. Clone & install / 克隆并安装

```bash
git clone https://github.com/yaoqinxue-cmd/BriStack.git
cd BriStack
npm install
```

### 2. Configure environment / 配置环境变量

```bash
cp .env.local.example .env.local
```

Edit `.env.local` / 编辑 `.env.local`：

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require

# Auth / 认证
ADMIN_PASSWORD_HASH=   # bcrypt hash — generate with: node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',10))"
SESSION_SECRET=        # any random 32+ char string / 任意 32 位以上随机字符串

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CREATOR_SLUG=my-space  # your public URL slug / 你的公开 URL 标识符

# AI (optional, for Penetration Score / 可选，用于内容穿透率评分)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Initialize database / 初始化数据库

```bash
npx drizzle-kit push
```

### 4. (Optional) Seed demo data / （可选）填充演示数据

```bash
npm run db:seed
```

### 5. Run / 启动

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login), enter your password, done.

打开 [http://localhost:3000/login](http://localhost:3000/login)，输入密码，即可开始使用。

---

## Run in GitHub Codespaces / 在 GitHub Codespaces 中运行

Click the button below to open this project in a ready-to-code cloud environment:

点击下方按钮，在云端开发环境中打开本项目（无需本地安装任何依赖）：

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/yaoqinxue-cmd/BriStack)

The devcontainer installs dependencies automatically. You'll still need to add your `.env.local` secrets in the Codespaces Secrets settings.

Devcontainer 会自动安装依赖并启动开发服务器。你仍需在 Codespaces Secrets 设置中填写 `.env.local` 所需的密钥。

---

## One-click Deploy to Vercel / 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaoqinxue-cmd/BriStack&env=DATABASE_URL,SESSION_SECRET,ADMIN_PASSWORD_HASH,NEXT_PUBLIC_APP_URL&project-name=bristack&repository-name=bristack)

Set the four required environment variables during setup. Everything else is optional.

部署时填写四个必填环境变量即可，其余均为可选项。

---

## Project Structure

```
bristack/
├── app/
│   ├── (auth)/login/            # Creator login
│   ├── (dashboard)/dashboard/   # Creator dashboard
│   │   ├── content/             # Issue list, editor, send
│   │   ├── subscribers/         # Subscriber management
│   │   ├── analytics/           # Dual-track analytics
│   │   └── settings/            # SMTP, AI, websites, sequences
│   ├── [slug]/                  # Public creator landing page
│   ├── embed/[key]/             # Embeddable subscribe widget
│   └── api/
│       ├── v1/                  # Public content API (feed, issues, search)
│       ├── mcp/                 # MCP Server (SSE transport)
│       ├── issues/              # Internal CRUD
│       ├── subscribers/         # Subscriber management
│       ├── subscribe/           # Public subscribe endpoint
│       └── settings/            # Creator settings
├── components/
│   └── editor/StructuredEditor.tsx
├── lib/
│   ├── db/schema.ts             # Drizzle schema (all tables)
│   ├── email/                   # Sender + react-email templates
│   ├── mcp/server.ts            # MCP tool implementations
│   ├── ai/                      # Penetration score + summarization
│   └── analytics/               # Bot detection + event logging
└── .env.local.example
```

---

## MCP Integration / MCP 接入

Add your BriStack Space to Claude Desktop by editing `claude_desktop_config.json`:

编辑 `claude_desktop_config.json`，将你的 BriStack Space 接入 Claude Desktop：

```json
{
  "mcpServers": {
    "my-space": {
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "x-creator-slug": "your-slug"
      }
    }
  }
}
```

Available MCP tools / 可用工具: `list_issues`, `get_issue`, `search_content`, `get_author_info`

---

## Public API / 公开 API

All endpoints require no authentication for published content.

已发布内容的所有端点无需鉴权即可访问。

```bash
# Get content feed (JSON Feed 1.1 format)
# 获取内容 Feed（JSON Feed 1.1 格式）
curl https://your-domain.com/api/v1/feed?slug=your-slug

# Get single issue / 获取单篇内容
curl https://your-domain.com/api/v1/issues/{id}

# Semantic search / 语义搜索
curl "https://your-domain.com/api/v1/search?q=AI+productivity&slug=your-slug"
```

---

## Embedding the Subscribe Widget / 嵌入订阅表单

Add a subscribe form to any website with a single `<iframe>`:

用一个 `<iframe>` 将订阅表单嵌入任何网站：

```html
<iframe
  src="https://your-domain.com/embed/{your-embed-key}"
  width="100%"
  height="180"
  frameborder="0"
  style="border:none;border-radius:12px;"
></iframe>
```

Each external website gets its own embed key, so subscriber sources are tracked independently.

每个外部网站拥有独立的 embed key，订阅来源自动独立追踪。

---

## Content Penetration Score / 内容穿透率评分

A metric unique to BriStack: when you publish, Claude reads your content and generates a summary. The score measures what percentage of your manually specified **key arguments** survive the AI compression layer.

BriStack 独有指标：发布时，Claude 读取你的内容并生成摘要，评分衡量你手动填写的**核心论点**在 AI 压缩层中的保留比例。

- **≥ 70%** — Your arguments are robust and AI-legible / 论点清晰，AI 可有效传达
- **40–70%** — Some points may be missed by AI readers / 部分论点可能被 AI 遗漏
- **< 40%** — Consider restructuring for clarity / 建议重新梳理内容结构

This matters because a growing share of your audience reads content through AI intermediaries.

这个指标至关重要，因为越来越多的读者通过 AI 中间层获取内容。

---

## Environment Variables Reference / 环境变量参考

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string / Neon PostgreSQL 连接字符串 |
| `SESSION_SECRET` | ✅ | Secret for iron-session encryption / iron-session 加密密钥 |
| `ADMIN_PASSWORD_HASH` | ✅ | bcrypt hash of your login password / 登录密码的 bcrypt 哈希值 |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full public URL (e.g. `https://yourdomain.com`) / 完整公开 URL |
| `CREATOR_SLUG` | ✅ | Default creator slug / 创作者默认 Slug |
| `ANTHROPIC_API_KEY` | Optional | Enables AI features (~$0.01/publish) / 启用 AI 功能（约 $0.01/次发布） |
| `CRON_SECRET` | Optional | For scheduled greeting emails / 用于定时问候邮件 |

---

## Roadmap / 路线图

- [ ] Paid subscriber tiers (Stripe integration) / 付费订阅等级（Stripe 集成）
- [ ] Scheduled publishing / 定时发布
- [ ] pgvector semantic search (embedding-based) / pgvector 向量语义搜索
- [ ] Multiple creator accounts / 多创作者账户
- [ ] Analytics export (CSV) / 数据导出（CSV）
- [ ] Open graph image generation / Open Graph 封面图生成

---

## License

MIT — use freely, contributions welcome.

MIT 协议 — 自由使用，欢迎贡献。

---

*Built for creators who want to be read by humans and understood by machines.*

*为希望同时被人类阅读、被机器理解的创作者而生。*
