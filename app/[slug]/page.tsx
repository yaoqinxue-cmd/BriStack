import { notFound } from "next/navigation";
import { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

interface CreatorData {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  subscriberCount: number;
  issueCount: number;
  recentIssues: IssuePreview[];
  mcpUrl: string;
  apiUrl: string;
}

interface IssuePreview {
  id: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  topics: string[] | null;
  readingTimeMinutes: number | null;
  publishedAt: string | null;
  coverImage: string | null;
}

async function getCreatorData(slug: string): Promise<CreatorData | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${appUrl}/api/creator/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCreatorData(slug);
  if (!data) return { title: "Not Found" };
  return {
    title: data.name,
    description: data.bio || `Subscribe to ${data.name}`,
    openGraph: {
      title: data.name,
      description: data.bio || `Subscribe to ${data.name}`,
      images: data.avatarUrl ? [data.avatarUrl] : [],
    },
  };
}

export default async function CreatorLandingPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await getCreatorData(slug);
  if (!data) notFound();

  return <LandingPageClient data={data} />;
}
