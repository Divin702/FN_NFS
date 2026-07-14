import Image from "next/image";
import { cn } from "@/lib/cn";

interface LogoProps {
  variant?: "icon" | "full";
  onDark?: boolean;
  size?: number;
  className?: string;
}

export function Logo({ variant = "full", onDark = false, size = 28, className }: LogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/loggo.png"
        alt="NFS"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        unoptimized
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/loggo.png"
        alt="NFS"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        unoptimized
      />
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
