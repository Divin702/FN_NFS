"use client";

import { useRef, useState } from "react";
import {
  ScanLine,
  Upload,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";

export type ScanKind =
  | "national_id"
  | "passport"
  | "agreement"
  | "transcription"
  | "document";

export interface ScannedDoc {
  kind: ScanKind;
  /** ID number, passport number, or detected document title. */
  identifier: string;
  /** Back-compat: populated only when kind === "national_id". */
  nationalId: string;
  /** Auto-classified document type (e.g. "Sale Agreement"), for "document" kind. */
  suggestedType: string;
  /** Rwandan land parcel UPI (Unique Parcel Identifier), if found on the page. */
  upi: string;
  rawText: string;
  /** A preview/OCR image. For PDFs this is the rendered first page. */
  imageDataUrl: string;
  /** The original file the user picked (image or PDF) — attach this as-is. */
  file: File;
  /** True when the original was a PDF. */
  isPdf: boolean;
}

/** @deprecated use ScannedDoc — kept so existing callers keep compiling. */
export type ScannedID = ScannedDoc;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Render the first page of a PDF to a PNG data URL so it can be OCR'd/previewed.
async function pdfFirstPageToImage(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  // Scale up for sharper text — OCR accuracy depends heavily on resolution.
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  return canvas.toDataURL("image/png");
}

// ── Per-kind extraction ───────────────────────────────────────────────────────

// Rwandan national ID: 16-digit number starting with 1.
function extractRwandanID(text: string): string {
  const cleaned = text.replace(/[\s\-_|]/g, "");
  const match = cleaned.match(/1\d{15}/);
  return match ? match[0] : "";
}

// Passport number: labelled value, MRZ line, or generic letter/digit pattern.
function extractPassport(text: string): string {
  const upper = text.toUpperCase();
  const lines = upper.split(/\n/).map((l) => l.replace(/\s/g, ""));

  // 1) MRZ (TD3): line 1 starts with "P<"; line 2 begins with the passport number.
  const l1 = lines.findIndex((l) => /^P[A-Z<]/.test(l) && l.includes("<"));
  if (l1 >= 0 && lines[l1 + 1]) {
    const num = lines[l1 + 1].slice(0, 9).replace(/</g, "");
    if (/^[A-Z0-9]{5,9}$/.test(num) && /\d/.test(num)) return num;
  }
  // Any long MRZ-style data line that starts with an alphanumeric run.
  const mrzLine = lines.find(
    (l) => l.length >= 28 && l.includes("<") && /^[A-Z0-9]{5,9}/.test(l),
  );
  if (mrzLine) {
    const num = mrzLine.slice(0, 9).replace(/</g, "");
    if (/^[A-Z0-9]{5,9}$/.test(num) && /\d/.test(num)) return num;
  }

  // 2) Labelled value: "Passport No: AB123456".
  const labeled = upper.match(
    /PASSPORT\s*(?:NO|NUMBER|N[°ºO])?\.?\s*[:#-]?\s*([A-Z]{0,2}\d{5,8}[A-Z]?)/,
  );
  if (labeled) return labeled[1];

  // 3) Generic: 1–2 letters + 6–8 digits (e.g. PC1234567), skipping the
  //    16-digit national ID. Then a plain 7–9 digit run as a last resort.
  const candidates = upper.match(/\b[A-Z]{0,2}\d{6,9}\b/g) ?? [];
  for (const c of candidates) {
    if (c.replace(/\D/g, "").length >= 16) continue; // national ID
    if (/^[A-Z]{1,2}\d{6,8}$/.test(c)) return c;
  }
  for (const c of candidates) {
    const digits = c.replace(/\D/g, "");
    if (!/^[A-Z]/.test(c) && digits.length >= 7 && digits.length <= 9) return c;
  }
  return "";
}

// Does the text clearly come from a passport, even if we couldn't parse a number?
function looksLikePassport(text: string): boolean {
  const upper = text.toUpperCase();
  return (
    /PASSPORT/.test(upper) ||
    /\bP[<O]/.test(upper.replace(/\s/g, "")) || // MRZ line 1 "P<"
    /REPUBLIC|REPUBLIQUE|REPUBULIKA/.test(upper)
  );
}

// For free-form documents: pick the most title-like line.
function detectTitle(text: string): string {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  const caps = lines.find(
    (l) =>
      l.length >= 4 && l.length <= 80 && l === l.toUpperCase() && /[A-Z]/.test(l),
  );
  const title = caps ?? lines[0];
  return title.length > 80 ? `${title.slice(0, 80)}…` : title;
}

// Auto-classify a document type from its text — no manual selection needed.
function classifyDocument(text: string): string {
  const t = text.toLowerCase();
  const rules: [RegExp, string][] = [
    [/power of attorney|procuration/, "Power of Attorney"],
    [/sale agreement|contract of sale|deed of sale|bill of sale/, "Sale Agreement"],
    [/lease|tenancy/, "Lease Agreement"],
    [/transcript|transcription|relev[ée]/, "Transcription"],
    [/affidavit|sworn statement/, "Affidavit"],
    [/memorandum of understanding|\bmou\b/, "Memorandum of Understanding"],
    [/last will|testament/, "Will"],
    [/declaration/, "Declaration"],
    [/certificate/, "Certificate"],
    [/\bdeed\b/, "Deed"],
    [/agreement|contract|convention/, "Agreement"],
  ];
  for (const [re, label] of rules) if (re.test(t)) return label;
  return "";
}

// Keywords that identify each accepted document type. Used when the scanner is
// constrained to a known set (e.g. only Agreements and Transcriptions) so it
// validates the upload instead of accepting any document.
const TYPE_KEYWORDS: Record<string, RegExp> = {
  agreement:
    /agreement|contract|convention|sale|lease|tenancy|deed|procuration|power of attorney|protocol/i,
  transcription: /transcript|transcription|relev[ée]/i,
  land: /\bland\b|parcel|\bupi\b|plot|isambu|ubutaka|amasambu/i,
  affidavit: /affidavit|sworn statement/i,
  declaration: /declaration/i,
  certificate: /certificate/i,
};

// Rwandan land parcels carry a UPI (Unique Parcel Identifier), e.g. 1/03/11/04/678.
function extractUPI(text: string): string {
  // Tidy OCR spacing around the slashes, then match the 5-segment identifier.
  const cleaned = text.replace(/\s*\/\s*/g, "/");
  const m = cleaned.match(/\b\d\/\d{2}\/\d{2}\/\d{2}\/\d{1,6}\b/);
  return m ? m[0] : "";
}

// Returns the first accepted type whose keywords appear in the text, or "".
function classifyAmong(text: string, accept: string[]): string {
  for (const type of accept) {
    const re = TYPE_KEYWORDS[type.toLowerCase()];
    if (re && re.test(text)) return type;
  }
  return "";
}

function listOr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "a recognized document";
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

interface KindMeta {
  label: string;
  scanLabel: string;
  hint: string;
  requireMatch: boolean;
  extract: (text: string) => string;
  notFound?: string;
  /** Accept the scan even if `extract` found nothing (e.g. clear passport). */
  fallbackAccept?: (text: string) => boolean;
}

const KIND_META: Record<ScanKind, KindMeta> = {
  national_id: {
    label: "National ID",
    scanLabel: "Scan your National ID",
    hint: "We read the 16-digit ID number",
    requireMatch: true,
    extract: extractRwandanID,
    notFound: "Could not detect a National ID number. Try a clearer photo.",
  },
  passport: {
    label: "Passport",
    scanLabel: "Scan your passport",
    hint: "We read the passport details",
    requireMatch: true,
    extract: extractPassport,
    fallbackAccept: looksLikePassport,
    notFound:
      "This doesn't look like a passport. Try a clearer photo of the photo page.",
  },
  agreement: {
    label: "Agreement",
    scanLabel: "Scan the agreement",
    hint: "We read the document text",
    requireMatch: false,
    extract: detectTitle,
  },
  transcription: {
    label: "Transcription",
    scanLabel: "Scan the transcription",
    hint: "We read the document text",
    requireMatch: false,
    extract: detectTitle,
  },
  document: {
    label: "Document",
    scanLabel: "Scan your document",
    hint: "We check the type and read the text",
    requireMatch: false,
    extract: detectTitle,
  },
};

interface Props {
  onScanned: (result: ScannedDoc) => void;
  /** Which document kinds this scanner accepts. Defaults to National ID only. */
  kinds?: ScanKind[];
  defaultKind?: ScanKind;
  label?: string;
  /**
   * For the "document" kind: restrict to these document types (e.g.
   * ["Agreement", "Transcription"]). A scan that doesn't match one of them is
   * rejected instead of being accepted as a generic document.
   */
  acceptTypes?: string[];
}

type State = "idle" | "scanning" | "done" | "error";

export function IDScanner({
  onScanned,
  kinds,
  defaultKind,
  label,
  acceptTypes,
}: Props) {
  const available = kinds && kinds.length ? kinds : ["national_id" as ScanKind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<ScanKind>(defaultKind ?? available[0]);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState("");
  const [upi, setUpi] = useState("");
  const [words, setWords] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  const meta = KIND_META[kind];

  async function handleFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setError("Please upload an image (JPG, PNG, WEBP) or a PDF.");
      setState("error");
      return;
    }

    setState("scanning");
    setProgress(0);
    setError("");
    setRendering(isPdf);

    try {
      // For PDFs, render the first page to an image before OCR.
      const imageDataUrl = isPdf
        ? await pdfFirstPageToImage(file)
        : await fileToDataUrl(file);
      setRendering(false);
      setPreview(imageDataUrl);

      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(imageDataUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round((m.progress ?? 0) * 100));
          }
        },
      });

      const raw = result.data.text;
      const value = meta.extract(raw);

      // Identity kinds: accept on a parsed value or a clear fallback match.
      if (meta.requireMatch) {
        const accepted = !!value || !!meta.fallbackAccept?.(raw);
        if (!accepted) {
          setError(meta.notFound ?? "Could not read this document. Try again.");
          setState("error");
          return;
        }
      }

      // Document kind: classify the type. When constrained to an accepted set,
      // validate the upload is actually one of them instead of taking anything.
      let suggestedType = "";
      if (!meta.requireMatch) {
        suggestedType = acceptTypes?.length
          ? classifyAmong(raw, acceptTypes)
          : classifyDocument(raw);
        if (acceptTypes?.length && !suggestedType) {
          setError(
            `This doesn't look like ${listOr(acceptTypes)}. Please upload one of those documents.`,
          );
          setState("error");
          return;
        }
      }

      const foundUpi = meta.requireMatch ? "" : extractUPI(raw);
      setExtracted(suggestedType || value);
      setUpi(foundUpi);
      setWords(raw.trim() ? raw.trim().split(/\s+/).length : 0);
      setState("done");
      onScanned({
        kind,
        identifier: value,
        nationalId: kind === "national_id" ? value : "",
        suggestedType,
        upi: foundUpi,
        rawText: raw,
        imageDataUrl,
        file,
        isPdf,
      });
    } catch {
      setRendering(false);
      setError(
        isPdf
          ? "Could not read this PDF. Try a clearer or text-based file."
          : "Scan failed. Please try again.",
      );
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setPreview(null);
    setExtracted("");
    setUpi("");
    setWords(0);
    setRendering(false);
    setError("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickKind(k: ScanKind) {
    setKind(k);
    reset();
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 overflow-hidden">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* Kind selector — only when more than one kind is allowed */}
      {available.length > 1 && state !== "scanning" && (
        <div className="flex flex-wrap gap-1.5 border-b border-gray-100 bg-white/60 p-2.5">
          {available.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickKind(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                k === kind
                  ? "bg-[#103060] text-white"
                  : "bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-700"
              }`}
            >
              {KIND_META[k].label}
            </button>
          ))}
        </div>
      )}

      {/* Idle */}
      {state === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-3 py-8 px-4 hover:bg-gray-100 transition-colors group"
        >
          <div className="h-12 w-12 rounded-xl bg-[#103060]/8 flex items-center justify-center group-hover:bg-[#103060]/12 transition-colors">
            {meta.requireMatch ? (
              <ScanLine size={22} className="text-[#103060]" />
            ) : (
              <FileText size={22} className="text-[#103060]" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {label ?? meta.scanLabel}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {acceptTypes?.length && !meta.requireMatch
                ? `Accepts ${listOr(acceptTypes)}`
                : meta.hint}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-lg bg-[#103060] px-4 py-2 text-xs font-semibold text-white">
            <Upload size={12} /> Choose file
          </span>
          <p className="text-[11px] text-gray-400">
            JPG · PNG · WEBP · PDF
          </p>
        </button>
      )}

      {/* Scanning */}
      {state === "scanning" && (
        <div className="p-5 flex flex-col items-center gap-4">
          {preview && (
            <div className="relative w-full max-w-50 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Document preview"
                className="w-full object-cover rounded-lg opacity-70"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute left-0 right-0 h-0.5 bg-[#103060]/70 shadow-[0_0_8px_2px_rgba(16,48,96,0.4)]"
                  style={{
                    animation: "scanLine 1.8s linear infinite",
                    top: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">
                {rendering
                  ? "Rendering PDF page…"
                  : `Reading ${meta.label.toLowerCase()}…`}
              </span>
              {!rendering && (
                <span className="text-xs font-semibold text-[#103060]">
                  {progress}%
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full bg-[#103060] ${
                  rendering
                    ? "w-1/3 animate-pulse"
                    : "transition-all duration-300"
                }`}
                style={rendering ? undefined : { width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Done */}
      {state === "done" && (
        <div className="flex items-center gap-3 border-l-2 border-emerald-400 bg-emerald-50/40 p-3.5">
          {/* Thumbnail of what was scanned */}
          {preview ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-emerald-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Scanned"
                className="h-full w-full object-cover"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <CheckCircle2 size={11} className="text-white" />
              </span>
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {meta.requireMatch ? (
              <>
                <p className="text-xs font-semibold text-emerald-700">
                  {meta.label} verified
                </p>
                {extracted ? (
                  <p className="mt-0.5 truncate font-mono text-sm font-bold tracking-wide text-gray-800">
                    {extracted}
                  </p>
                ) : (
                  <p className="mt-0.5 truncate text-sm font-medium text-gray-600">
                    Captured from photo
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700">
                    Document scanned
                  </span>
                  <span className="text-[11px] text-emerald-600/70">
                    {words} words
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {extracted ? (
                    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-[#103060] px-2 py-0.5 text-[11px] font-semibold text-white">
                      {extracted}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      Text captured
                    </span>
                  )}
                  {upi && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-700">
                      UPI {upi}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
            title="Scan again"
          >
            <RefreshCw size={13} /> Rescan
          </button>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <X size={18} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700">Scan failed</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold text-[#103060] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
