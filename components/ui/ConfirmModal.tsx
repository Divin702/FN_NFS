"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, CheckCircle2, X, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export type ConfirmTone = "danger" | "warning" | "info" | "success";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  icon?: LucideIcon;
}

const TONES: Record<
  ConfirmTone,
  { iconBg: string; iconColor: string; defaultIcon: LucideIcon; buttonVariant: "primary" | "danger" }
> = {
  danger:  { iconBg: "bg-red-50",    iconColor: "text-red-600",    defaultIcon: AlertTriangle, buttonVariant: "danger"  },
  warning: { iconBg: "bg-amber-50",  iconColor: "text-amber-600",  defaultIcon: AlertTriangle, buttonVariant: "primary" },
  info:    { iconBg: "bg-brand-50",  iconColor: "text-brand-600",  defaultIcon: Info,          buttonVariant: "primary" },
  success: { iconBg: "bg-green-50",  iconColor: "text-green-600",  defaultIcon: CheckCircle2,  buttonVariant: "primary" },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "info",
  loading = false,
  icon,
}: ConfirmModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const config = TONES[tone];
  const Icon = icon ?? config.defaultIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-200",
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          className="absolute right-3 top-3 p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer disabled:cursor-not-allowed z-10"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-6 pb-5 text-center">
          <div
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full mb-3",
              config.iconBg,
              config.iconColor,
            )}
          >
            <Icon size={22} />
          </div>
          <h3 id="confirm-title" className="text-base font-semibold text-foreground">
            {title}
          </h3>
          {description && (
            <div className="mt-1.5 text-sm text-muted leading-relaxed">{description}</div>
          )}
        </div>

        <div className="flex gap-2.5 px-5 pb-5">
          <Button
            type="button"
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            className="flex-1 cursor-pointer"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
