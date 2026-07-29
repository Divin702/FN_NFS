"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Braces,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

// Fields that auto-fill from the dossier — inserting one drops a {{token}} the
// app replaces automatically when a dossier is created.
const AUTO_INSERTS: { key: string; label: string }[] = [
  { key: "clientName", label: "Client Name" },
  { key: "nationalId", label: "National ID" },
  { key: "phone", label: "Phone" },
  { key: "date", label: "Date" },
  { key: "notaryName", label: "Notary Name" },
  { key: "serviceName", label: "Service Name" },
  { key: "officialFee", label: "Official Fee" },
  { key: "notaryFee", label: "Notary Fee" },
  { key: "totalFee", label: "Total Fee" },
];

function slugKey(label: string): string {
  const words = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  return words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded text-sm transition-colors",
        active
          ? "bg-brand-100 text-brand-700"
          : "text-muted hover:bg-surface hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "Write template content…",
}: RichEditorProps) {
  const [insertOpen, setInsertOpen] = useState(false);
  const insertRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!insertOpen) return;
    function onClick(e: MouseEvent) {
      if (insertRef.current && !insertRef.current.contains(e.target as Node)) {
        setInsertOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [insertOpen]);

  if (!editor) return null;

  function insertToken(key: string) {
    editor?.chain().focus().insertContent(`{{${key}}}`).run();
    setInsertOpen(false);
  }

  function insertCustom() {
    const label = window.prompt(
      "Field label (e.g. Property Address). The notary will fill this in.",
    );
    if (!label || !label.trim()) return;
    const key = slugKey(label);
    if (!key) return;
    insertToken(key);
  }

  return (
    <div className="rounded-md border border-border overflow-visible">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered list"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Insert fillable field */}
        <div className="relative" ref={insertRef}>
          <button
            type="button"
            onClick={() => setInsertOpen((o) => !o)}
            title="Insert a fillable field"
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              insertOpen
                ? "bg-brand-100 text-brand-700"
                : "text-brand-600 hover:bg-brand-50",
            )}
          >
            <Braces size={13} /> Insert field
            <ChevronDown size={12} />
          </button>
          {insertOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-white shadow-xl overflow-hidden">
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Auto-filled from the dossier
              </p>
              <div className="max-h-56 overflow-y-auto py-0.5">
                {AUTO_INSERTS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => insertToken(f.key)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-surface"
                  >
                    <span>{f.label}</span>
                    <code className="text-[10px] text-muted">{`{{${f.key}}}`}</code>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={insertCustom}
                className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                <Plus size={13} /> Custom field the notary fills…
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={14} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-50 px-4 py-3 text-sm text-foreground focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-45 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />

      {/* Hint */}
      <div className="border-t border-border bg-surface px-3 py-1.5 text-[11px] text-muted">
        Tip: use <b>Insert field</b> to add fillable spots like{" "}
        <code className="text-brand-600">{"{{clientName}}"}</code> or a custom
        one — the notary fills these when creating a dossier.
      </div>
    </div>
  );
}
