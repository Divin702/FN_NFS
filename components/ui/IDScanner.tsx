"use client";

import { useRef, useState } from "react";
import { ScanLine, Upload, CheckCircle2, RefreshCw, X } from "lucide-react";

export interface ScannedID {
  nationalId: string;
  rawText: string;
}

interface Props {
  onScanned: (result: ScannedID) => void;
  label?: string;
}

type State = "idle" | "scanning" | "done" | "error";

// Extracts a Rwandan national ID (16-digit number starting with 1)
function extractRwandanID(text: string): string {
  const cleaned = text.replace(/[\s\-_|]/g, "");
  const match = cleaned.match(/1\d{15}/);
  return match ? match[0] : "";
}

export function IDScanner({ onScanned, label = "Scan National ID" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState("");
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      setState("error");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    setState("scanning");
    setProgress(0);
    setError("");

    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round((m.progress ?? 0) * 100));
          }
        },
      });

      const raw = result.data.text;
      const id  = extractRwandanID(raw);

      if (!id) {
        setError("Could not detect a National ID. Try a clearer photo.");
        setState("error");
        return;
      }

      setExtracted(id);
      setState("done");
      onScanned({ nationalId: id, rawText: raw });
    } catch {
      setError("Scan failed. Please try again.");
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setPreview(null);
    setExtracted("");
    setError("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 overflow-hidden">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* Idle */}
      {state === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-3 py-8 px-4 hover:bg-gray-100 transition-colors group"
        >
          <div className="h-12 w-12 rounded-xl bg-[#103060]/8 flex items-center justify-center group-hover:bg-[#103060]/12 transition-colors">
            <ScanLine size={22} className="text-[#103060]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload a photo of your ID — fields fill automatically
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-lg bg-[#103060] px-4 py-2 text-xs font-semibold text-white">
            <Upload size={12} /> Choose Photo
          </span>
        </button>
      )}

      {/* Scanning */}
      {state === "scanning" && (
        <div className="p-5 flex flex-col items-center gap-4">
          {preview && (
            <div className="relative w-full max-w-[200px] rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="ID preview" className="w-full object-cover rounded-lg opacity-70" />
              {/* Scan line animation */}
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
              <span className="text-xs font-medium text-gray-600">Reading ID...</span>
              <span className="text-xs font-semibold text-[#103060]">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[#103060] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Done */}
      {state === "done" && (
        <div className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700">ID detected</p>
            <p className="text-sm font-mono font-bold text-gray-800 mt-0.5 truncate">{extracted}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Scan again"
          >
            <RefreshCw size={14} />
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
