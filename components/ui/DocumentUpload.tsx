"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Paperclip, Loader2, X, FileText, FileImage, File } from "lucide-react";
import { cn } from "@/lib/cn";

interface DocumentUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  className?: string;
}

interface CloudinaryResult {
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
}

function FileIcon({ format }: { format: string }) {
  const f = format?.toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(f))
    return <FileImage size={16} className="text-blue-500" />;
  if (["pdf"].includes(f))
    return <FileText size={16} className="text-red-500" />;
  return <File size={16} className="text-gray-400" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileName(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
  } catch {
    return "document";
  }
}

export function DocumentUpload({
  value,
  onChange,
  onRemove,
  folder = "nfs/documents",
  label = "Attach document",
  className,
}: DocumentUploadProps) {
  const [loading, setLoading]         = useState(false);
  const [meta, setMeta]               = useState<{ name: string; size: string; format: string } | null>(null);

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        maxFiles: 1,
        resourceType: "auto",
        clientAllowedFormats: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"],
        maxFileSize: 20_000_000, // 20 MB
        folder,
        sources: ["local", "url", "google_drive"],
      }}
      onSuccess={(result) => {
        const info = result?.info as CloudinaryResult | undefined;
        if (info?.secure_url) {
          onChange(info.secure_url);
          setMeta({
            name: info.original_filename || "document",
            size: formatBytes(info.bytes ?? 0),
            format: info.format ?? "",
          });
        }
        setLoading(false);
      }}
      onQueuesStart={() => setLoading(true)}
      onQueuesEnd={() => setLoading(false)}
    >
      {({ open }) => (
        <div className={cn("w-full", className)}>
          {value ? (
            /* ── Uploaded file preview ── */
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-100 shadow-sm">
                <FileIcon format={meta?.format ?? ""} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {meta?.name ?? fileName(value)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  {meta?.format && <span className="uppercase font-semibold">{meta.format}</span>}
                  {meta?.size && <span>{meta.size}</span>}
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#103060] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => open()}
                  className="text-xs text-gray-400 hover:text-[#103060] transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                >
                  Replace
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemove();
                      setMeta(null);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Upload trigger ── */
            <button
              type="button"
              onClick={() => open()}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-3.5",
                "border-gray-200 bg-gray-50 text-gray-500",
                "hover:border-[#103060]/40 hover:bg-[#103060]/[0.02] hover:text-[#103060]",
                "disabled:opacity-50 transition-colors cursor-pointer",
              )}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-[#103060]" />
              ) : (
                <Paperclip size={15} />
              )}
              <span className="text-sm font-medium">
                {loading ? "Uploading…" : label}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                PDF, DOCX, JPG · max 20 MB
              </span>
            </button>
          )}
        </div>
      )}
    </CldUploadWidget>
  );
}
