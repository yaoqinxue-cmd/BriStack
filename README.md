# BriStack

> **AI-native content distribution platform** — publish once, reach humans via email, AI Agents via API, and LLM clients via MCP.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaoqinxue-cmd/BriStack&env=DATABASE_URL,SESSION_SECRET,ADMIN_PASSWORD_HASH,NEXT_PUBLIC_APP_URL&project-name=bristack&repository-name=bristack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)

---

## What is BriStack?

Most newsletter tools are built for the email era. BriStack is built for what comes next.

When someone subscribes, they may be a human reading on their phone — or an AI agent processing your content at 3 AM. BriStack serves both, without compromise:

- **Humans** get beautifully formatted emails with AI-powered summaries
- **AI Agents** get structured JSON via a clean REST API
- **LLM clients** (Claude, Cursor, etc.) get a full MCP server to query your content in real-time

All from a single publish action.

---

## Key Features

### Content
- **Structured editor** — title, subtitle, cover, rich body, AI summary, key points, topics, author note
- **Content Penetration Score** — measures how well your key arguments survive AI summarization (0–100)
- **Channel visibility control** — publish to landing page, email, or specific external websites independently
- **Browse mode** — preview exactly how readers see the final article

### Distribution
- **Email** — Nodemailer/Resend SMTP, batched delivery, open tracking pixel
- **JSON Feed** (`/api/v1/feed`) — RSS-compatible, AI-optimized with key points and structured metadata
- **MCP Server** (`/api/mcp`) — plug your Space into Claude Desktop or Cursor as a tool
- **Public REST API** — `GET /api/v1/issues/:id`, `GET /api/v1/search?q=...`

### Subscribers
- **Three subscriber types**: Human (email) / Agent (API key) / MCP
- **Source tracking** — know exactly which landing page or embed widget each subscriber came from
- **Subscriber sequences** — welcome email + configurable delayed greeting email
- **Level system** — automatic upgrade from Level 1 (subscribed) to Level 4 (core audience)

### Analytics
- **Dual-track dashboard** — human engagement vs. AI/bot traffic, strictly separated
- **Bot detection** — UA fingerprinting + behavior heuristics (GPTBot, ClaudeBot, etc.)
- **Per-channel subscriber counts** — landing page vs. each external website

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

## Quick Start

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- An SMTP provider or [Resend](https://resend.com) account

### 1. Clone & install

```bash
git clone https://github.com/yaoqinxue-cmd/BriStack.git
cd BriStack
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require

# Auth
ADMIN_PASSWORD_HASH=   # bcrypt hash — generate with: node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',10))"
SESSION_SECRET=        # any random 32+ char string

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CREATOR_SLUG=my-space  # your public URL slug

# AI (optional, for Penetration Score)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Initialize database

```bash
npx drizzle-kit push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login), enter your password, done.

---

## Run in GitHub Codespaces

Click the button below to open this project in a ready-to-code cloud environment:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/yaoqinxue-cmd/BriStack)

The devcontainer installs dependencies automatically. You'll still need to add your `.env.local` secrets in the Codespaces Secrets settings.

---

## One-click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yaoqinxue-cmd/BriStack&env=DATABASE_URL,SESSION_SECRET,ADMIN_PASSWORD_HASH,NEXT_PUBLIC_APP_URL&project-name=bristack&repository-name=bristack)

Set the four required environment variables during setup. Everything else is optional.

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

## MCP Integration

Add your BriStack Space to Claude Desktop by editing `claude_desktop_config.json`:

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

Available MCP tools: `list_issues`, `get_issue`, `search_content`, `get_author_info`

---

## Public API

All endpoints require no authentication for published content.

```bash
# Get content feed (JSON Feed 1.1 format)
curl https://your-domain.com/api/v1/feed?slug=your-slug

# Get single issue
curl https://your-domain.com/api/v1/issues/{id}

# Semantic search
curl "https://your-domain.com/api/v1/search?q=AI+productivity&slug=your-slug"
```

---

## Embedding the Subscribe Widget

Add a subscribe form to any website with a single `<iframe>`:

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

---

## Content Penetration Score

A metric unique to BriStack: when you publish, Claude reads your content and generates a summary. The score measures what percentage of your manually specified **key arguments** survive the AI compression layer.

- **≥ 70%** — Your arguments are robust and AI-legible
- **40–70%** — Some points may be missed by AI readers
- **< 40%** — Consider restructuring for clarity

This matters because a growing share of your audience reads content through AI intermediaries.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Secret for iron-session encryption |
| `ADMIN_PASSWORD_HASH` | ✅ | bcrypt hash of your login password |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full public URL (e.g. `https://yourdomain.com`) |
| `CREATOR_SLUG` | ✅ | Default creator slug |
| `ANTHROPIC_API_KEY` | Optional | Enables AI features (~$0.01/publish) |
| `CRON_SECRET` | Optional | For scheduled greeting emails |

---

## Roadmap

- [ ] Paid subscriber tiers (Stripe integration)
- [ ] Scheduled publishing
- [ ] pgvector semantic search (embedding-based)
- [ ] Multiple creator accounts
- [ ] Analytics export (CSV)
- [ ] Open graph image generation

---

## License

MIT — use freely, contributions welcome.

---

*Built for creators who want to be read by humans and understood by machines.*
