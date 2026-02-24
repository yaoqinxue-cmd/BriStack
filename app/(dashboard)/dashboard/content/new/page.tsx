"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StructuredEditor } from "@/components/editor/StructuredEditor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewContentPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleSave(data: {
    title: string;
    content: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    authorNote: string;
    humanWritten: boolean;
  }) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "draft" }),
      });
      if (res.ok) {
        const issue = await res.json();
        router.push(`/dashboard/content/${issue.id}`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish(data: {
    title: string;
    content: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    authorNote: string;
    humanWritten: boolean;
  }) {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "published" }),
      });
      if (res.ok) {
        const issue = await res.json();
        router.push(`/dashboard/content/${issue.id}`);
      }
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/content"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">新建内容</h1>
      </div>

      <StructuredEditor
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />
    </div>
  );
}
