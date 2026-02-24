"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useState, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  Sparkles,
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WebsiteOption {
  id: string;
  name: string;
}

interface StructuredEditorProps {
  initialTitle?: string;
  initialSubtitle?: string;
  initialCoverImage?: string;
  initialContent?: string;
  initialSummary?: string;
  initialKeyPoints?: string[];
  initialTopics?: string[];
  initialAuthorNote?: string;
  initialHumanWritten?: boolean;
  initialTargetChannels?: string[];
  websites?: WebsiteOption[];
  onSave: (data: {
    title: string;
    subtitle: string;
    coverImage: string;
    content: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    authorNote: string;
    humanWritten: boolean;
    targetChannels: string[];
  }) => Promise<void>;
  onPublish?: (data: {
    title: string;
    subtitle: string;
    coverImage: string;
    content: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    authorNote: string;
    humanWritten: boolean;
    targetChannels: string[];
  }) => Promise<void>;
  isSaving?: boolean;
  isPublishing?: boolean;
  isPublished?: boolean;
}

export function StructuredEditor({
  initialTitle = "",
  initialSubtitle = "",
  initialCoverImage = "",
  initialContent = "",
  initialSummary = "",
  initialKeyPoints = [],
  initialTopics = [],
  initialAuthorNote = "",
  initialHumanWritten = true,
  initialTargetChannels = [],
  websites = [],
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  isPublished,
}: StructuredEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [summary, setSummary] = useState(initialSummary);
  const [keyPoints, setKeyPoints] = useState<string[]>(
    initialKeyPoints.length > 0 ? initialKeyPoints : [""]
  );
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [topicInput, setTopicInput] = useState("");
  const [authorNote, setAuthorNote] = useState(initialAuthorNote);
  const [humanWritten, setHumanWritten] = useState(initialHumanWritten);
  const [targetChannels, setTargetChannels] = useState<string[]>(initialTargetChannels);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "开始写作... 记录你的独特视角和第一手经验",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-indigo-600 underline" },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "min-h-[400px] focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  const getContent = useCallback(() => {
    if (!editor) return "";
    return editor.getHTML();
  }, [editor]);

  async function handleGenerateAI() {
    if (!editor) return;
    const content = editor.getText();
    if (!content.trim() || !title.trim()) {
      alert("请先填写标题和内容，再生成 AI 摘要");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        if (data.keyPoints?.length) setKeyPoints(data.keyPoints);
      }
    } catch (e) {
      console.error("AI generation failed", e);
    }
    setIsGeneratingAI(false);
  }

  function addKeyPoint() {
    setKeyPoints([...keyPoints, ""]);
  }

  function updateKeyPoint(index: number, value: string) {
    const updated = [...keyPoints];
    updated[index] = value;
    setKeyPoints(updated);
  }

  function removeKeyPoint(index: number) {
    if (keyPoints.length <= 1) return;
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  }

  function addTopic(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const topic = topicInput.trim();
      if (topic && !topics.includes(topic)) {
        setTopics([...topics, topic]);
      }
      setTopicInput("");
    }
  }

  function removeTopic(topic: string) {
    setTopics(topics.filter((t) => t !== topic));
  }

  function toggleChannel(channelId: string) {
    setTargetChannels(prev =>
      prev.includes(channelId) ? prev.filter(c => c !== channelId) : [...prev, channelId]
    );
  }

  function isChannelEnabled(channelId: string) {
    // Empty array = all channels open
    return targetChannels.length === 0 || targetChannels.includes(channelId);
  }

  function getFormData() {
    return {
      title,
      subtitle,
      coverImage,
      content: getContent(),
      summary,
      keyPoints: keyPoints.filter((p) => p.trim()),
      topics,
      authorNote,
      humanWritten,
      targetChannels,
    };
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Main editor - left 3 columns */}
      <div className="col-span-3 space-y-4">
        {/* Cover Image */}
        {coverImage && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
            <img src={coverImage} alt="封面" className="w-full h-full object-cover" />
            <button
              onClick={() => setCoverImage("")}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 focus:outline-none focus:ring-0 bg-transparent"
        />

        {/* Subtitle */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="副标题（可选）"
          className="w-full text-base text-gray-500 placeholder-gray-300 border-0 focus:outline-none focus:ring-0 bg-transparent"
        />

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 border-b border-gray-200 pb-2 flex-wrap">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold")}
            title="加粗"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic")}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive("heading", { level: 2 })}
            title="H2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor?.isActive("heading", { level: 3 })}
            title="H3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive("bulletList")}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive("orderedList")}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive("blockquote")}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            active={editor?.isActive("code")}
            title="代码"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="分割线"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Editor content */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 min-h-[400px]">
          <EditorContent editor={editor} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onSave(getFormData())}
            disabled={isSaving || !title.trim()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存草稿"}
          </button>
          {onPublish && !isPublished && (
            <button
              onClick={() => onPublish(getFormData())}
              disabled={isPublishing || !title.trim()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPublishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPublishing ? "发布中..." : "发布"}
            </button>
          )}
          {isPublished && (
            <span className="text-sm text-green-600 font-medium">✓ 已发布</span>
          )}
        </div>
      </div>

      {/* AI Fields Panel - right 2 columns */}
      <div className="col-span-2 space-y-5">
        {/* Cover Image */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            封面图片
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* AI Generate Button */}
        <button
          onClick={handleGenerateAI}
          disabled={isGeneratingAI}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {isGeneratingAI ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGeneratingAI ? "AI 生成中..." : "AI 自动填充摘要和论点"}
        </button>

        {/* AI Summary */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            AI 摘要 <span className="text-indigo-500 normal-case font-normal">（为 AI 摘要层优化）</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="一段话摘要，当用户的 AI 助手总结内容时，这段话会被优先引用..."
            rows={4}
            className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Key Points */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            核心论点 <span className="text-indigo-500 normal-case font-normal">（最多5条）</span>
          </label>
          <div className="space-y-2">
            {keyPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 flex-shrink-0">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateKeyPoint(index, e.target.value)}
                  placeholder={`核心论点 ${index + 1}`}
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeKeyPoint(index)}
                  className="text-gray-300 hover:text-gray-500 flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {keyPoints.length < 5 && (
              <button
                onClick={addKeyPoint}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1"
              >
                <Plus className="w-3 h-3" />
                添加论点
              </button>
            )}
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            主题标签
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {topic}
                <button
                  onClick={() => removeTopic(topic)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={addTopic}
            placeholder="输入标签，按 Enter 添加"
            className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Author Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            作者注释 <span className="text-amber-500 normal-case font-normal">（AI 无法替代）</span>
          </label>
          <textarea
            value={authorNote}
            onChange={(e) => setAuthorNote(e.target.value)}
            placeholder="你对这篇内容的个人感受、背后的故事、或想直接对读者说的话..."
            rows={3}
            className="w-full text-sm text-gray-700 placeholder-gray-400 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
          />
        </div>

        {/* Human Written Declaration */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="humanWritten"
            checked={humanWritten}
            onChange={(e) => setHumanWritten(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300"
          />
          <label htmlFor="humanWritten" className="text-xs text-gray-600 cursor-pointer">
            此内容由人类创作，AI 仅用于辅助（摘要、润色），核心观点均来自作者
          </label>
        </div>

        {/* Channel Visibility */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            内容渠道 <span className="text-gray-400 normal-case font-normal">（留空 = 全渠道开放）</span>
          </label>
          <div className="space-y-1.5 p-3 bg-gray-50 rounded-lg">
            {[
              { id: "landing_page", label: "公开落地页" },
              { id: "email", label: "邮件发送" },
              ...websites.map(w => ({ id: w.id, label: w.name })),
            ].map(channel => (
              <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChannelEnabled(channel.id)}
                  onChange={() => {
                    // When unchecking: if currently "all open" (empty), expand to all channels minus this one
                    if (targetChannels.length === 0) {
                      const allIds = ["landing_page", "email", ...websites.map(w => w.id)];
                      setTargetChannels(allIds.filter(id => id !== channel.id));
                    } else {
                      toggleChannel(channel.id);
                    }
                  }}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">{channel.label}</span>
              </label>
            ))}
            {targetChannels.length > 0 && (
              <button
                onClick={() => setTargetChannels([])}
                className="text-xs text-indigo-500 hover:text-indigo-700 mt-1"
              >
                重置为全渠道开放
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-gray-100 text-gray-900"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {children}
    </button>
  );
}
