# BriStack User Journey

**Product Version:** MVP
**Document Date:** 2026-02-24
**Audience:** Content creators, subscribers, AI Agent integrators

---

## Overview

BriStack is a content distribution platform built for the AI era. Creators publish structured content here; readers access it via email, web, AI assistants, or API.

The platform serves three types of subscribers simultaneously:
- **Human subscribers** — read directly via email or web
- **AI Agent subscribers** — pull structured content periodically via API key
- **MCP subscribers** — connect the Space to AI clients like Claude Desktop and query content in real time

---

## I. Creator Journey

### 1. Login & Initial Setup

Creators log in with an admin password. On first login, the system automatically creates the creator account.

After logging in, go to the **Settings page** to complete initial setup:

```
Landing Page Settings (shows subscriber count from landing page)
├── Space name (shown on landing page and emails)
├── Personal slug (determines landing page URL, e.g. /your-slug)
├── Bio (shown on landing page)
└── Avatar URL

My External Websites (each site shown independently, with its own subscriber count)
├── Add external website (enter site name and URL)
├── Get embed code (iframe code to copy-paste into the site)
└── Embed preview (live preview of the subscribe form)

Email Service
├── Choose delivery method: SMTP or Resend
├── Enter provider config (test connection to verify)
├── From name and email address
└── Test connection (click to instantly verify)

AI Features
└── Anthropic API Key (for Content Penetration Score)
```

**Subscriber source tracking:** Each channel's subscriber count (landing page, external website A, external website B) is shown separately on the settings page, helping creators understand acquisition performance by channel.

### 2. Creating Content

Go to **Content** → **New Content** to open the structured editor:

```
Editor fields
├── Title
├── Subtitle (optional)
├── Cover image URL (optional)
├── Body content (rich text editor, Markdown-compatible)
│
├── AI-era structured fields
│   ├── AI summary (auto-generated, manually editable)
│   ├── Key arguments (list format, up to 5)
│   ├── Topic tags
│   └── Author note (handwritten — AI cannot override)
│
├── Metadata
│   ├── Estimated reading time
│   └── Human-written declaration
│
├── Content Channels (control which channels this content is visible on)
│   ├── ☑ Public landing page
│   ├── ☑ Email delivery
│   └── ☑ External websites (each added site as an independent checkbox)
│
└── Content Penetration Score (auto-calculated at publish time)
```

**Content channel control** is a core distribution management feature: creators can specify, per piece of content, which channels it is available on. Examples:
- An internal analysis piece delivered only via email, not shown on the public landing page
- Content targeted at a specific website's audience, visible only to subscribers from that site
- Default (all checked) = open to all channels

**Content Penetration Score** is the platform's flagship innovation metric: at publish time, the system feeds the content to AI for compression into a summary, then calculates what percentage of the creator's "key arguments" were preserved. Target score ≥ 70%.

**Browse mode:** After editing, switch to Browse Mode to preview the final presentation of your content.

### 3. Content Management

The **content list** provides two layers of filtering to help creators manage large volumes of content:

```
Status filter (horizontal tabs)
├── All
├── Published
└── Draft

Channel filter (horizontal tabs, dynamically generated)
├── All channels
├── Landing page (only content open to the landing page)
├── Email (only content deliverable via email)
└── External Website A / External Website B (filter by individual site)
```

Each content item supports:
- Click to open the editor
- Hover to reveal action buttons (revert to draft, delete)
- Published items show their penetration score and publish date

### 4. Publishing & Distribution

When you click **Publish**, the content is automatically distributed to each enabled channel based on its channel settings:

| Channel | Path | Notes |
|---------|------|-------|
| Landing page content list | `/{slug}` | Requires "Public landing page" channel enabled |
| JSON Feed API | `/api/v1/feed` | Same as landing page channel; AI-friendly |
| MCP Server | `/api/mcp` | Queryable by MCP subscribers |
| Email delivery | Manually triggered | Requires "Email delivery" channel enabled |

### 5. Email Delivery

After publishing, go to the **Send** page to push content to email subscribers:

```
Send configuration
├── Preview send (send a test email to yourself)
├── Filter conditions
│   ├── By subscriber level (Level 1–4 or all)
│   └── By tag filter
└── Actual send
    ├── Batch delivery: 10 recipients per batch, 1 second between batches (rate-limit safe)
    └── Send results: N sent / N failed
```

Email content automatically includes:
- Creator byline header
- Publish date and estimated reading time
- Topic tags
- AI summary block (structured)
- Full body text
- Author note (if any)
- Unsubscribe link (compliance)
- Tracking pixel (for real open tracking)

### 6. Subscriber Sequences

**Welcome email** (sent immediately on subscription):
- Subject and body customizable in settings
- Supports variables: `{name}` (subscriber name), `{creatorName}` (creator name)
- Includes an MCP integration config example

**Greeting email** (configurable delay, default 3 days after subscription):
- Can be enabled or disabled
- Fully customizable content

### 7. Analytics & Insights

The **dual-track analytics dashboard** strictly separates human traffic from AI/bot traffic:

```
Human influence metrics
├── Real human subscriber count (by source: landing page / each external site)
├── Subscriber level distribution (Level 1–4)
└── Tag distribution

AI ecosystem metrics
├── Agent subscriber count
├── MCP subscriber count
└── Query volume trends per channel
```

**Bot detection:**
- UA fingerprinting (GPTBot, ClaudeBot, PerplexityBot, and other known crawlers)
- Behavioral signals (access speed, access patterns)
- Classification: `human` / `known_bot` / `suspected_bot`

**Subscriber level system** (automatic upgrades):

| Level | Meaning | Condition |
|-------|---------|-----------|
| Level 1 | Subscribed | Completed subscription |
| Level 2 | Verified human | Read ≥ 3 full articles |
| Level 3 | Active relationship | Replied to an email at least once |
| Level 4 | Core audience | 6+ months active + multiple interactions |

---

## II. Human Subscriber Journey

### 1. Discovery & Subscription

Subscribers find the creator's Space through:

- **Landing page:** `/{creator-slug}` — shows creator bio, stats, and the latest content list
- **Embedded forms on external sites:** Creators can embed a subscribe form on their blog, homepage, or any external site (each site gets a unique embed key; subscriber source is automatically recorded)

Subscription form fields:
- Email address (required)
- Name (optional)

On submission, a welcome email is automatically sent (if enabled by the creator). The system records the subscription source (landing page vs. which external site), so creators can analyze channel performance.

### 2. Receiving Content

**Email channel:**
- Each issue arrives as a well-formatted HTML email (only when the issue has the email channel enabled)
- Email includes an AI summary block for quick digestion
- Full body text included — no external links required

**Web reading:**
- Click content items on the landing page to go directly to the article page (only content with landing page channel enabled is shown)
- Article page includes: AI summary (blue block), key arguments (numbered list), full body text, author note
- Subscribe prompt at the bottom of each article

### 3. Managing Subscription

The email footer includes an "Unsubscribe" link — clicking it immediately unsubscribes the reader from future emails.

If unsubscribed by mistake, the reader can return to the landing page and re-enter their email to re-subscribe.

---

## III. AI Agent Subscriber Journey

Agents subscribe with an API key instead of an email address, and pull structured content via API (not HTML email).

### 1. Registering an Agent Subscription

```http
POST /api/v1/agent/subscribe
Content-Type: application/json

{
  "agent_id": "my-personal-assistant",
  "agent_type": "personal_assistant",
  "preferred_format": "structured_json",
  "query_frequency": "on_demand"
}
```

Returns an API key in the format `lttr_xxxxxxxxxxxx`.

### 2. Fetching Content

**Content list** (with summaries and key arguments):
```http
GET /api/v1/feed
Authorization: Bearer lttr_xxxxxxxxxxxx
```

> Note: Only returns content with the "landing page" channel enabled (equivalent to publicly visible content).

**Single full article** (Markdown + structured fields):
```http
GET /api/v1/issues/{id}
Authorization: Bearer lttr_xxxxxxxxxxxx
```

**Semantic search:**
```http
GET /api/v1/search?q=keyword
Authorization: Bearer lttr_xxxxxxxxxxxx
```

### 3. Content Format

The API returns standardized JSON containing:

```json
{
  "id": "uuid",
  "title": "Article title",
  "summary": "AI-generated summary, optimized for machine consumption",
  "key_points": ["Key argument 1", "Key argument 2", "Key argument 3"],
  "topics": ["AI", "Product"],
  "full_content_markdown": "...",
  "full_content_html": "...",
  "author_note": "Creator's handwritten note",
  "reading_time_minutes": 8,
  "content_penetration_score": 78,
  "published_at": "2026-02-24T10:00:00Z"
}
```

---

## IV. MCP Subscriber Journey

MCP subscribers connect the Space as a tool inside AI clients like Claude Desktop or Cursor, enabling real-time content retrieval during conversations with AI.

### 1. Integration Setup

On the creator's landing page, find the "MCP Integration" block, copy the config snippet, and paste it into your AI client's config file:

**Claude Desktop example** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "creator-slug": {
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "x-creator-slug": "creator-slug"
      }
    }
  }
}
```

Save the config and restart the AI client — integration complete.

### 2. Usage

Once connected, ask your AI directly in conversation:

- **"What's new recently?"** → calls `list_issues`, returns the latest content list with summaries
- **"Find me articles about AI products"** → calls `search_content`, semantically searches relevant content
- **"Get the full text of this article"** → calls `get_issue`, returns the full body in Markdown
- **"What is this Space about?"** → calls `get_author_info`, returns the creator's bio and Space description

### 3. Available Tools

| Tool name | Function |
|-----------|----------|
| `list_issues` | Get the latest content list (with summaries and key arguments) |
| `get_issue` | Get the full text of a specific article (Markdown) |
| `search_content` | Semantic search across all published content |
| `get_author_info` | Get creator info and Space description |

---

## V. Cross-Role Journey Map

```
Creator
  │ Login → Configure settings (landing page + external sites + email service)
  │   ↓
  │ Create content → Select channels (landing page / email / per site) → Publish
  │   ↓                                                                   ↓
  │ Filter content list by channel                              Trigger email delivery
  └───────────────────────────────────────→ View dual-track analytics dashboard
                                              ├── Subscriber growth by channel
                                              └── Agent / MCP query trends

Human Subscriber
  │ Discovers landing page or embedded form on external site
  │   ↓
  │ Enters email → Receives welcome email (source automatically recorded)
  └── Later: email delivery / browse articles on landing page / reply to email

AI Agent Subscriber
  └── Register API key → Pull public-channel content → Integrate into workflows or AI apps

MCP Subscriber
  └── Configure Claude Desktop → Query content in real time → Access creator insights & analysis
```

---

## VI. Key URL Structure

| Path | Content | Access |
|------|---------|--------|
| `/{slug}` | Creator landing page | Public |
| `/dashboard` | Creator admin panel | Login required |
| `/dashboard/content` | Content list (status + channel dual filter) | Login required |
| `/dashboard/content/new` | New content | Login required |
| `/dashboard/content/{id}` | Edit content (with channel selector) | Login required |
| `/dashboard/subscribers` | Subscriber management | Login required |
| `/dashboard/analytics` | Analytics dashboard | Login required |
| `/dashboard/settings` | Settings (with per-channel subscriber counts) | Login required |
| `/embed/{key}` | External site subscribe form (iframe embed) | Public |
| `/api/v1/feed` | JSON Feed (landing page channel content) | Public |
| `/api/v1/issues/{id}` | Single article API | Public |
| `/api/v1/search` | Content search API | Public |
| `/api/mcp` | MCP Server endpoint | Public |
| `/unsubscribe` | Unsubscribe page | Token-gated link |

---

*BriStack — helping creators build knowledge authority and genuine human connections in the AI Agent era*
