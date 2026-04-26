import Link from "next/link";
import { FileText } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 lg:grid lg:grid-cols-[42%_1fr]" style={{ minHeight: "100dvh" }}>
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-500 p-14 text-white">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <FileText size={17} />
          </span>
          <span className="text-xl tracking-tight">NFS</span>
        </Link>

        <div className="space-y-4">
          <div className="w-10 h-1 bg-white/40 rounded-full" />
          <blockquote className="text-2xl font-semibold leading-snug">
            &ldquo;A trusted digital platform for every notarial need in Rwanda.&rdquo;
          </blockquote>
          <p className="text-brand-200 text-sm leading-relaxed">
            Notary File System — secure, transparent, and accessible to every citizen.
          </p>
        </div>

        <p className="text-brand-300 text-xs">
          &copy; {new Date().getFullYear()} NFS. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel — uses position:fixed trick to truly center ── */}
      <div
        className="relative flex flex-col bg-white px-5 py-12 sm:px-10"
        style={{ minHeight: "100dvh" }}
      >
        {/* mobile logo top-left */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-brand-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <FileText size={15} />
            </span>
            <span className="text-lg">NFS</span>
          </Link>
        </div>

        {/* centered form content */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
