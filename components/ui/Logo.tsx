import { cn } from "@/lib/cn";

interface LogoProps {
  variant?: "icon" | "full";
  onDark?: boolean;
  size?: number;
  className?: string;
}

function NMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  // onDark = true  → white box + navy N  (for navy/dark backgrounds)
  // onDark = false → navy box + white N  (for light backgrounds)
  const bg = onDark ? "white" : "#103060";
  const stroke = onDark ? "#103060" : "white";
  const opacity = onDark ? undefined : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="7" fill={bg} fillOpacity={onDark ? 1 : 1} />
      <path
        d="M9 22L9 10L23 22L23 10"
        stroke={stroke}
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ variant = "full", onDark = false, size = 28, className }: LogoProps) {
  if (variant === "icon") {
    return <NMark size={size} onDark={onDark} />;
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <NMark size={size} onDark={onDark} />
      <div className="leading-none">
        <p
          className={cn(
            "text-[15px] font-bold tracking-tight leading-none",
            onDark ? "text-white" : "text-brand-600",
          )}
        >
          NFS
        </p>
        <p
          className={cn(
            "text-[8px] font-semibold tracking-[0.18em] uppercase leading-none mt-0.75",
            onDark ? "text-white/40" : "text-muted",
          )}
        >
          Filing System
        </p>
      </div>
    </div>
  );
}
