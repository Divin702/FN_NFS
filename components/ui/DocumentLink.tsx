import { FileText, FileImage, File as FileIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

function fileNameFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "document";
  } catch {
    return "document";
  }
}

function FileTypeIcon({ url }: { url: string }) {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext))
    return <FileImage size={15} className="text-blue-500" />;
  if (ext === "pdf") return <FileText size={15} className="text-red-500" />;
  return <FileIcon size={15} className="text-gray-400" />;
}

interface DocumentLinkProps {
  url: string;
  /** Caption shown under the filename, e.g. "Document 1". */
  caption?: string;
  className?: string;
}

/** Rich file row: type icon + real filename + caption + open affordance. */
export function DocumentLink({ url, caption, className }: DocumentLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 hover:border-[#103060]/30 hover:bg-white transition-colors",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-100">
        <FileTypeIcon url={url} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-gray-800 truncate group-hover:text-[#103060]">
          {fileNameFromUrl(url)}
        </span>
        {caption && <span className="block text-xs text-gray-400">{caption}</span>}
      </span>
      <ExternalLink size={14} className="text-gray-300 group-hover:text-[#103060] shrink-0" />
    </a>
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
      <p className="text-xs text-gray-400 mb-1.5">
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
