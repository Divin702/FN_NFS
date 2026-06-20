// Shared date/time formatting helpers.

/** Absolute date + time, e.g. "20 Jun 2026, 10:59 PM" */
export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Absolute date only, e.g. "20 Jun 2026" */
export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Relative time, e.g. "just now", "5 min ago", "2 hr ago", "yesterday", "3 days ago". */
export function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;

  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;
  if (day < 30) return `${Math.round(day / 7)} wk ago`;
  if (day < 365) return `${Math.round(day / 30)} mo ago`;
  return `${Math.round(day / 365)} yr ago`;
}

/** "2 hr ago · 20 Jun 2026, 10:59 PM" */
export function relativeWithAbsolute(iso?: string | null): string {
  if (!iso) return "—";
  return `${relativeTime(iso)} · ${fmtDateTime(iso)}`;
}
