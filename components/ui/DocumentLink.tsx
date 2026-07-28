import { FileText, ExternalLink, Eye, Download } from "lucide-react";
import { cn } from "@/lib/cn";

export function toDownloadUrl(url: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

const OFFICE_EXTS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv"];

/**
 * URL to OPEN a file for viewing in a new tab.
 * Browsers render PDFs/images/text inline, but can't display Office documents —
 * so those are routed through Microsoft's Office web viewer to preview in-tab
 * instead of downloading.
 */
export function previewUrl(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (OFFICE_EXTS.includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
}

type FileKind = "image" | "pdf" | "other";

function fileKind(url: string): FileKind {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "heic"].includes(ext))
    return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

function rawName(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "document";
  } catch {
    return "document";
  }
}

// Cloudinary names are random hashes — show a friendly type label instead.
function displayName(url: string, kind: FileKind): string {
  const name = rawName(url);
  const looksLikeHash = /^[a-z0-9]{10,}\.\w+$/i.test(name);
  if (!looksLikeHash) return name;
  if (kind === "pdf") return "PDF document";
  if (kind === "image") return "Image";
  return "Document";
}

const KIND_LABEL: Record<FileKind, string> = {
  image: "Image",
  pdf: "PDF",
  other: "File",
};

interface DocumentLinkProps {
  url: string;
  /** Caption shown under the filename, e.g. "Document 1". */
  caption?: string;
  className?: string;
}

/** Rich file row: type-aware thumbnail/badge + name + view & download actions. */
export function DocumentLink({ url, caption, className }: DocumentLinkProps) {
  const kind = fileKind(url);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors hover:border-[#103060]/30 hover:bg-white",
        className,
      )}
    >
      {/* View area — opens the file in a new tab */}
      <a
        href={previewUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {/* Thumbnail for images, coloured badge for everything else */}
        {kind === "image" ? (
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <Eye
                size={16}
                className="text-white opacity-0 transition-opacity group-hover:opacity-100"
              />
            </span>
          </span>
        ) : (
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg",
              kind === "pdf"
                ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                : "bg-gray-100 text-gray-400 ring-1 ring-gray-200",
            )}
          >
            <FileText size={16} />
            <span className="mt-0.5 text-[9px] font-bold tracking-wide">
              {KIND_LABEL[kind]}
            </span>
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-800 group-hover:text-[#103060]">
            {displayName(url, kind)}
          </span>
          <span className="mt-0.5 block text-xs text-gray-400">
            {caption ? `${caption} · ` : ""}
            {kind === "pdf"
              ? "Open PDF"
              : kind === "image"
                ? "View image"
                : "Open file"}
          </span>
        </span>
      </a>

      {/* Actions — open & download */}
      <div className="flex shrink-0 items-center gap-0.5">
        <a
          href={previewUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          title="Open"
          aria-label="Open in new tab"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#103060]/5 hover:text-[#103060]"
        >
          <ExternalLink size={15} />
        </a>
        <a
          href={toDownloadUrl(url)}
          download
          title="Download"
          aria-label="Download"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#103060]/5 hover:text-[#103060]"
        >
          <Download size={15} />
        </a>
      </div>
    </div>
  );
}

/** A labeled list of DocumentLinks. */
export function DocumentList({
  urls,
  label = "Documents",
}: {
  urls: string[];
  label?: string;
}) {
  if (!urls.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs text-gray-400">
        {label} ({urls.length})
      </p>
      <div className="flex flex-col gap-1.5">
        {urls.map((url, i) => (
          <DocumentLink key={i} url={url} caption={`Document ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
