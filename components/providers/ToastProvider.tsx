"use client";

import { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIG: Record<ToastType, { Icon: React.ElementType; bar: string; bg: string; border: string; icon: string }> = {
  success: { Icon: CheckCircle2, bar: "bg-green-500",  bg: "bg-white", border: "border-green-200", icon: "text-green-500" },
  error:   { Icon: AlertCircle,  bar: "bg-red-500",    bg: "bg-white", border: "border-red-200",   icon: "text-red-500"   },
  warning: { Icon: AlertTriangle,bar: "bg-amber-400",  bg: "bg-white", border: "border-amber-200", icon: "text-amber-500" },
  info:    { Icon: Info,         bar: "bg-brand-500",  bg: "bg-white", border: "border-brand-200", icon: "text-brand-500" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { Icon, bar, bg, border, icon } = CONFIG[toast.type];
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Slide in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Progress bar countdown
  useEffect(() => {
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleDismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 250);
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-lg w-80 max-w-[calc(100vw-2.5rem)]",
        "transition-all duration-250 ease-out",
        bg, border,
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )}
      role="alert"
    >
      {/* Content */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <Icon size={17} className={cn("shrink-0 mt-0.5", icon)} />
        <p className="flex-1 text-sm leading-snug text-foreground">{toast.message}</p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-muted hover:text-foreground transition-colors mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div
          className={cn("h-full transition-none", bar)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, type, duration }]);
  }, []);

  const success = useCallback((msg: string, d?: number) => add(msg, "success", d), [add]);
  const error   = useCallback((msg: string, d?: number) => add(msg, "error",   d), [add]);
  const warning = useCallback((msg: string, d?: number) => add(msg, "warning", d), [add]);
  const info    = useCallback((msg: string, d?: number) => add(msg, "info",    d), [add]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-200 flex flex-col gap-2.5 items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
