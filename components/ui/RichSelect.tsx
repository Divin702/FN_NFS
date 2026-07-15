"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface RichOption {
  value: string;
  label: string;
  description?: string;
  avatarUrl?: string;
}

interface RichSelectProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: RichOption[];
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  emptyText?: string;
}

interface PanelPos {
  left: number;
  width: number;
  top: number;
  bottom: number;
  openUp: boolean;
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function RichSelect({
  label,
  required,
  placeholder = "Select…",
  value,
  onChange,
  options,
  error,
  disabled,
  searchable,
  emptyText = "No options",
}: RichSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => setMounted(true), []);

  // Position the portaled panel against the trigger, flipping up when there
  // isn't enough room below.
  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 300 && r.top > spaceBelow;
    setPos({
      left: r.left,
      width: r.width,
      top: r.bottom + 6,
      bottom: window.innerHeight - r.top + 6,
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => updatePosition();
    // capture scrolls from any ancestor as well as window resize
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
      setQuery("");
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered =
    searchable && query
      ? options.filter(
          (o) =>
            o.label.toLowerCase().includes(query.toLowerCase()) ||
            o.description?.toLowerCase().includes(query.toLowerCase()),
        )
      : options;

  const panel = open && mounted && pos && (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: pos.left,
        width: pos.width,
        ...(pos.openUp ? { bottom: pos.bottom } : { top: pos.top }),
      }}
      className="z-70 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden"
    >
      {searchable && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      )}
      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            {emptyText}
          </p>
        ) : (
          filtered.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  active ? "bg-[#103060]/5" : "hover:bg-gray-50",
                )}
              >
                <Avatar option={o} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">
                    {o.label}
                  </span>
                  {o.description && (
                    <span className="block text-xs text-gray-400 truncate">
                      {o.description}
                    </span>
                  )}
                </span>
                {active && (
                  <Check size={15} className="text-[#103060] shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5" ref={rootRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060]",
            "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60",
            open
              ? "border-[#103060] ring-2 ring-[#103060]/20"
              : "border-gray-200",
            error && "border-red-400",
          )}
        >
          {selected ? (
            <>
              <Avatar option={selected} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 truncate">
                  {selected.label}
                </span>
                {selected.description && (
                  <span className="block text-xs text-gray-400 truncate">
                    {selected.description}
                  </span>
                )}
              </span>
            </>
          ) : (
            <span className="flex-1 text-sm text-gray-400">{placeholder}</span>
          )}
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-gray-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {/* Dropdown panel — portaled to <body> so no ancestor overflow/stacking can clip it */}
        {mounted && createPortal(panel, document.body)}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Avatar({ option }: { option: RichOption }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-[#103060]/10 text-[#103060] text-xs font-bold">
      {option.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials(option.label)
      )}
    </span>
  );
}
