/**
 * Demo seed script — populates the database with sample data for demonstration.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires DATABASE_URL in .env.local
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const DEMO_SLUG = process.env.CREATOR_SLUG || "demo";

async function seed() {
  console.log("🌱 Seeding demo data...\n");

  // ── 1. Creator ────────────────────────────────────────────
  let creator = await db.query.creators.findFirst({
    where: eq(schema.creators.slug, DEMO_SLUG),
  });

  if (!creator) {
    [creator] = await db
      .insert(schema.creators)
      .values({
        name: "BriStack Demo",
        slug: DEMO_SLUG,
        bio: "An AI-native newsletter platform. This is a demo Space with sample content.",
        email: "demo@bristack.com",
        fromName: "BriStack Demo",
        fromEmail: "demo@bristack.com",
      })
      .returning();
    console.log(`✅ Created creator: ${creator.name} (slug: ${creator.slug})`);
  } else {
    console.log(`ℹ️  Creator already exists: ${creator.slug}`);
  }

  // ── 2. Settings ───────────────────────────────────────────
  await db
    .insert(schema.settings)
    .values({
      creatorId: creator.id,
      welcomeEmailEnabled: true,
      welcomeEmailSubject: "Welcome to {creatorName}!",
      emailProvider: "smtp",
    })
    .onConflictDoNothing();

  // ── 3. Sample issues ──────────────────────────────────────
  const sampleIssues = [
    {
      title: "Why AI Agents Will Become Your Most Engaged Readers",
      subtitle: "The shift from human-only audiences to hybrid human+machine distribution",
      summary:
        "As AI agents proliferate, they increasingly consume content on behalf of humans. Creators who structure their content for machine readability alongside human readability will reach broader audiences.",
      keyPoints: [
        "AI agents now account for 30–60% of API traffic on content platforms",
        "Structured key points dramatically improve AI comprehension accuracy",
        "Content Penetration Score predicts AI-layer fidelity before publishing",
        "Hybrid-format content achieves 2x reach vs. HTML-only newsletters",
      ] as string[],
      topics: ["AI", "Content Strategy", "Distribution"],
      fullMarkdown: `# Why AI Agents Will Become Your Most Engaged Readers

The inbox is no longer just for humans.

When you send a newsletter, a growing slice of your "readers" are AI agents — personal assistants, research tools, and automated pipelines that consume your content and relay summaries to actual humans downstream.

## The Numbers

Early data from content APIs suggests that AI-originated requests already account for **30–60% of programmatic traffic** on publishing platforms. This isn't bots scraping for SEO. These are intentional, legitimate AI systems acting on behalf of subscribed users.

## What Changes for Creators

The implication is significant: your content now has two audiences.

1. **The human audience** — reads for narrative, voice, and emotional resonance
2. **The machine audience** — reads for facts, structure, and extractable insights

Most newsletter tools optimize for only the first. BriStack is built to serve both.

## The Penetration Problem

Here's the challenge: when an AI agent summarizes your 1,500-word essay, roughly 40–60% of your specific claims survive the compression. If you've made three careful arguments, one or two will be lost.

The **Content Penetration Score** measures this before you publish. Write your key arguments explicitly. Check the score. Rewrite until your ideas survive the machine layer.

## What This Means for Distribution

Creators who adapt early will enjoy an asymmetric advantage: their ideas spread through AI networks that humans never directly touch — research assistants, enterprise tools, personal AI agents — reaching audiences who would never have opened a newsletter.

> The best content in the AI era is legible to both humans and machines.`,
      fullHtml: `<h1>Why AI Agents Will Become Your Most Engaged Readers</h1><p>The inbox is no longer just for humans.</p><p>When you send a newsletter, a growing slice of your "readers" are AI agents — personal assistants, research tools, and automated pipelines that consume your content and relay summaries to actual humans downstream.</p><h2>The Numbers</h2><p>Early data from content APIs suggests that AI-originated requests already account for <strong>30–60% of programmatic traffic</strong> on publishing platforms. This isn't bots scraping for SEO. These are intentional, legitimate AI systems acting on behalf of subscribed users.</p><h2>What Changes for Creators</h2><p>The implication is significant: your content now has two audiences.</p><p>1. <strong>The human audience</strong> — reads for narrative, voice, and emotional resonance</p><p>2. <strong>The machine audience</strong> — reads for facts, structure, and extractable insights</p><p>Most newsletter tools optimize for only the first. BriStack is built to serve both.</p><h2>The Penetration Problem</h2><p>Here's the challenge: when an AI agent summarizes your 1,500-word essay, roughly 40–60% of your specific claims survive the compression. If you've made three careful arguments, one or two will be lost.</p><p>The <strong>Content Penetration Score</strong> measures this before you publish.</p><blockquote>The best content in the AI era is legible to both humans and machines.</blockquote>`,
      authorNote: "This idea came from watching my own AI assistant summarize newsletters I'd written. Half of what I thought I'd said was gone.",
      contentPenetrationScore: 82,
      readingTimeMinutes: 5,
      status: "published" as const,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "The Three Subscriber Types That Define Modern Reach",
      subtitle: "Humans, Agents, and MCP clients — and why you need all three",
      summary:
        "Modern content distribution involves three distinct subscriber types: humans who read directly, AI agents that pull structured data via API, and MCP clients that enable real-time conversational access. Each requires different formatting and delivery mechanisms.",
      keyPoints: [
        "Human subscribers need narrative arc and emotional resonance",
        "Agent subscribers need structured JSON with key points and machine-readable summaries",
        "MCP subscribers enable real-time Q&A against your entire content archive",
        "The same content can serve all three with proper structure",
      ] as string[],
      topics: ["Subscribers", "MCP", "Distribution"],
      fullMarkdown: `# The Three Subscriber Types That Define Modern Reach

Not all subscribers are equal — and not all subscribers are even human.

## Type 1: Human Subscribers

These are your traditional readers. They subscribe via email, read in their inbox or browser, and respond emotionally to your voice and ideas. They are the heart of your community.

For human subscribers, optimize for: narrative flow, emotional hooks, personal stories, clear opinions.

## Type 2: Agent Subscribers

Agent subscribers are AI systems that pull your content programmatically — daily digest builders, research pipelines, enterprise knowledge bases. They authenticate with an API key and consume structured JSON, not HTML emails.

For agent subscribers, optimize for: clean summaries, enumerated key points, factual precision, machine-readable metadata.

## Type 3: MCP Subscribers

MCP (Model Context Protocol) subscribers integrate your content directly into LLM clients like Claude Desktop or Cursor. They don't receive pushes — instead, they pull on demand, querying your full archive in real time during conversations.

A user might ask Claude: *"What does [creator] think about AI regulation?"* — and Claude will search your MCP-connected Space for the answer.

For MCP subscribers, optimize for: searchable titles, consistent terminology, well-structured arguments that survive semantic search.

## The Unified Approach

BriStack lets you write once and distribute to all three. The structured editor captures key points and summaries that feed the machine layer, while the full HTML serves human readers.`,
      fullHtml: `<h1>The Three Subscriber Types That Define Modern Reach</h1><p>Not all subscribers are equal — and not all subscribers are even human.</p><h2>Type 1: Human Subscribers</h2><p>These are your traditional readers. They subscribe via email, read in their inbox or browser, and respond emotionally to your voice and ideas.</p><h2>Type 2: Agent Subscribers</h2><p>Agent subscribers are AI systems that pull your content programmatically. They authenticate with an API key and consume structured JSON, not HTML emails.</p><h2>Type 3: MCP Subscribers</h2><p>MCP subscribers integrate your content directly into LLM clients like Claude Desktop or Cursor. They query your full archive in real time during conversations.</p><p>A user might ask Claude: <em>"What does [creator] think about AI regulation?"</em> — and Claude will search your MCP-connected Space for the answer.</p>`,
      authorNote: "I realized I was writing for only one of these three audiences. This post is me processing that realization.",
      contentPenetrationScore: 76,
      readingTimeMinutes: 4,
      status: "published" as const,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Content Penetration Score: A New Metric for the AI Era",
      subtitle: "How to measure whether your ideas survive the AI summarization layer",
      summary:
        "Content Penetration Score quantifies the percentage of a creator's explicit key arguments that survive AI summarization. A score of 70%+ indicates the content is structurally robust for AI-mediated distribution.",
      keyPoints: [
        "Penetration Score = (preserved key points / total key points) × 100",
        "Average blog post scores 35–55% without optimization",
        "Explicit numbered lists and headers significantly improve scores",
        "Target ≥ 70% for content intended for AI-heavy distribution channels",
      ] as string[],
      topics: ["Analytics", "Content Quality", "AI"],
      fullMarkdown: `# Content Penetration Score: A New Metric for the AI Era

What percentage of your ideas survive when an AI reads your work?

## The Motivation

Imagine you write a carefully argued essay with five key insights. A reader's AI assistant summarizes it as: "The author discusses trends in X." Two sentences. Five insights gone.

This isn't a failure of AI — it's a failure of content structure.

## How It's Calculated

1. You write your content and explicitly list your **key arguments** (up to 5)
2. At publish time, Claude reads your full content and generates a summary
3. The system checks: which of your key arguments appear — directly or semantically — in the summary?
4. Score = (preserved arguments / total arguments) × 100

A score of **82** means 4 out of 5 of your key points survived the AI compression layer.

## What Affects the Score

**Increases score:**
- Explicit statements ("The key insight is...")
- Numbered or bulleted lists for arguments
- Repetition of key terms across the piece
- Clear section headers that mirror key points

**Decreases score:**
- Implicit arguments buried in narrative
- Ideas expressed only through metaphor or story
- Jargon or neologisms the AI hasn't seen before

## The Target

Aim for **≥ 70%**. Below 40%, consider restructuring. The goal isn't to write for machines — it's to write clearly enough that machines don't lose your meaning.`,
      fullHtml: `<h1>Content Penetration Score: A New Metric for the AI Era</h1><p>What percentage of your ideas survive when an AI reads your work?</p><h2>The Motivation</h2><p>Imagine you write a carefully argued essay with five key insights. A reader's AI assistant summarizes it as: "The author discusses trends in X." Two sentences. Five insights gone.</p><h2>How It's Calculated</h2><p>1. You write your content and explicitly list your <strong>key arguments</strong> (up to 5)</p><p>2. At publish time, Claude reads your full content and generates a summary</p><p>3. The system checks: which of your key arguments appear — directly or semantically — in the summary?</p><p>4. Score = (preserved arguments / total arguments) × 100</p><h2>What Affects the Score</h2><p><strong>Increases score:</strong> Explicit statements, numbered lists, clear headers.</p><p><strong>Decreases score:</strong> Implicit arguments, metaphor-heavy writing, niche jargon.</p>`,
      authorNote: "This metric didn't exist before we built BriStack. We invented it because we needed it.",
      contentPenetrationScore: 91,
      readingTimeMinutes: 6,
      status: "published" as const,
      publishedAt: new Date(),
    },
  ];

  for (const issueData of sampleIssues) {
    const existing = await db.query.issues.findFirst({
      where: eq(schema.issues.title, issueData.title),
    });
    if (!existing) {
      await db.insert(schema.issues).values({
        creatorId: creator.id,
        ...issueData,
      });
      console.log(`✅ Created issue: "${issueData.title.slice(0, 50)}..."`);
    } else {
      console.log(`ℹ️  Issue already exists: "${issueData.title.slice(0, 40)}..."`);
    }
  }

  // ── 4. Sample subscribers ─────────────────────────────────
  const sampleSubscribers = [
    { email: "alice@example.com", name: "Alice Chen", level: 3 as const },
    { email: "bob@example.com", name: "Bob Lee", level: 2 as const },
    { email: "carol@example.com", name: "Carol Wang", level: 1 as const },
    { email: "dave@example.com", name: "Dave Kim", level: 4 as const },
    { email: "eve@example.com", name: "Eve Zhang", level: 1 as const },
  ];

  for (const sub of sampleSubscribers) {
    const existing = await db.query.subscribers.findFirst({
      where: eq(schema.subscribers.email, sub.email),
    });
    if (!existing) {
      await db.insert(schema.subscribers).values({
        creatorId: creator.id,
        type: "human",
        email: sub.email,
        name: sub.name,
        level: sub.level,
        status: "active",
      });
      console.log(`✅ Created subscriber: ${sub.name}`);
    }
  }

  console.log("\n🎉 Demo seed complete!");
  console.log(`\n📖 Visit your landing page: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${DEMO_SLUG}`);
  console.log(`🔐 Login at: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login\n`);
}

seed().catch(console.error);
