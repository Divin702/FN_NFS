"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/Topbar";
import { Eraser, Download, Save, CheckCircle2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { getUser, saveAuth, getToken } from "@/lib/auth";
import { cn } from "@/lib/cn";

type Tool = "pen" | "eraser";

interface Point { x: number; y: number }

// ── Canvas hook ───────────────────────────────────────────────────────────────

function useSignatureCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const drawing   = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const toolRef = useRef<Tool>("pen");
  const colorRef = useRef("#103060");
  const sizeRef = useRef(2.5);

  const getCtx = useCallback(() => {
    const c = canvasRef.current;
    return c ? c.getContext("2d") : null;
  }, [canvasRef]);

  const toCanvas = useCallback((e: PointerEvent | TouchEvent): Point | null => {
    const c = canvasRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    let clientX = 0, clientY = 0;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, [canvasRef]);

  const draw = useCallback((to: Point) => {
    const ctx = getCtx();
    if (!ctx || !lastPoint.current) return;
    const from = lastPoint.current;
    ctx.save();
    ctx.globalCompositeOperation = toolRef.current === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth   = toolRef.current === "eraser" ? sizeRef.current * 6 : sizeRef.current;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
    lastPoint.current = to;
    setIsEmpty(false);
  }, [getCtx]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    function onDown(e: PointerEvent) {
      e.preventDefault();
      const p = toCanvas(e);
      if (!p) return;
      drawing.current = true;
      lastPoint.current = p;
    }
    function onMove(e: PointerEvent) {
      if (!drawing.current) return;
      e.preventDefault();
      const p = toCanvas(e);
      if (p) draw(p);
    }
    function onUp() { drawing.current = false; lastPoint.current = null; }

    c.addEventListener("pointerdown", onDown, { passive: false });
    c.addEventListener("pointermove", onMove, { passive: false });
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointerleave", onUp);

    return () => {
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointerleave", onUp);
    };
  }, [canvasRef, toCanvas, draw]);

  function clear() {
    const ctx = getCtx();
    const c = canvasRef.current;
    if (!ctx || !c) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setIsEmpty(true);
  }

  function toDataURL(): string | null {
    const c = canvasRef.current;
    if (!c) return null;
    // Compose on white bg for the saved image
    const tmp = document.createElement("canvas");
    tmp.width  = c.width;
    tmp.height = c.height;
    const ctx = tmp.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(c, 0, 0);
    return tmp.toDataURL("image/png");
  }

  return { isEmpty, clear, toDataURL, toolRef, colorRef, sizeRef };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignatureDesignerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isEmpty, clear, toDataURL, toolRef, colorRef, sizeRef } = useSignatureCanvas(canvasRef);

  const [tool, setTool]   = useState<Tool>("pen");
  const [color, setColor] = useState("#103060");
  const [size, setSize]   = useState(2.5);
  const [saved, setSaved] = useState(false);

  // Keep refs in sync
  useEffect(() => { toolRef.current  = tool;  }, [tool,  toolRef]);
  useEffect(() => { colorRef.current = color; }, [color, colorRef]);
  useEffect(() => { sizeRef.current  = size;  }, [size,  sizeRef]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (signatureUrl: string) =>
      api.patch("/auth/me/signature", { signatureUrl }),
    onSuccess: (updatedUser) => {
      // Update cached user with new signature
      const token = getToken();
      if (token && updatedUser) {
        const current = getUser();
        if (current) saveAuth(token, { ...current, ...(updatedUser as object) } as typeof current);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleSave() {
    const dataUrl = toDataURL();
    if (!dataUrl) return;
    save(dataUrl);
  }

  function handleDownload() {
    const dataUrl = toDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href     = dataUrl;
    a.download = "signature.png";
    a.click();
  }

  // Pre-load existing signature
  useEffect(() => {
    const user = getUser();
    if (!user?.signature || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = user.signature;
  }, []);

  const COLORS = ["#103060", "#000000", "#1e293b", "#64748b", "#1d4ed8", "#dc2626"];
  const SIZES  = [1.5, 2.5, 4, 6];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Signature Designer" />

      <main className="flex-1 overflow-auto p-5 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-5">

          <p className="text-sm text-muted">
            Draw your signature below. It will appear on your notary profile visible to clients.
          </p>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl border border-border p-3">
            {/* Tool toggle */}
            <div className="flex items-center gap-1 bg-surface rounded-xl p-0.5">
              {(["pen", "eraser"] as Tool[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTool(t)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    tool === t
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {t === "eraser" ? <Eraser size={13} /> : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7-7-7" />
                      <path d="M5 19h14" />
                    </svg>
                  )}
                  {t}
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); setTool("pen"); }}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all",
                    color === c && tool === "pen" ? "border-brand-500 scale-110" : "border-transparent"
                  )}
                />
              ))}
            </div>

            {/* Size */}
            <div className="flex items-center gap-1.5 ml-auto">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-lg transition-all",
                    size === s ? "bg-brand-500" : "bg-surface hover:bg-gray-200"
                  )}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{
                      width: s * 2.5,
                      height: s * 2.5,
                      backgroundColor: size === s ? "#fff" : "#374151",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="relative bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full touch-none cursor-crosshair"
              style={{ display: "block" }}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-sm select-none">Draw your signature here…</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={clear}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium text-muted hover:text-foreground hover:border-gray-300 transition-colors"
            >
              <RotateCcw size={14} /> Clear
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isEmpty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium text-muted hover:text-foreground hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              <Download size={14} /> Download
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isEmpty || isPending}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm ml-auto"
            >
              {isPending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : saved ? (
                <><CheckCircle2 size={14} /> Saved!</>
              ) : (
                <><Save size={14} /> Save Signature</>
              )}
            </button>
          </div>

          {saved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={15} />
              Signature saved. Clients browsing notaries will see it on your profile.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
