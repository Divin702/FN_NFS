"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface SignaturePadProps {
  /** Existing signature data URL (shows as a saved preview). */
  value?: string;
  /** Called with a PNG data URL when the user saves a drawn signature. */
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
}

export function SignaturePad({
  value,
  onChange,
  onClear,
  label = "Signature",
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Size the canvas backing store to its CSS box (crisp lines, correct coords).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#103060";
    }
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = pos(e);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPoint.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
    if (!hasInk) setHasInk(true);
  }

  function end() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onClear?.();
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onChange(canvas.toDataURL("image/png"));
  }

  // Saved-preview state
  if (value) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Signature" className="h-12 w-28 object-contain bg-white rounded-lg border border-emerald-100" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
              <Check size={14} /> Signature captured
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Redraw
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full h-32 touch-none cursor-crosshair bg-white"
        />
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <PenLine size={12} /> Sign above with mouse or finger
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clear}
              disabled={!hasInk}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-500 disabled:opacity-40 transition-colors"
            >
              <Eraser size={12} /> Clear
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!hasInk}
              className="flex items-center gap-1 rounded-lg bg-[#103060] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0d2750] disabled:opacity-40 transition-colors"
            >
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
