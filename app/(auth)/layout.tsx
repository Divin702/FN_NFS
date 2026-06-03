import Link from "next/link";
import { FileText, ShieldCheck, Fingerprint, FolderOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">

      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between bg-slate-950 border-r border-white/8 p-12">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <FileText size={17} className="text-white" />
          </span>
          <span className="text-white text-xl tracking-tight">NFS</span>
        </Link>

        {/* Center content */}
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Notary File System
            </p>
            <h2 className="text-2xl font-bold text-white leading-snug">
              A trusted digital platform for every notarial need in Rwanda.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Secure, transparent, and built for Rwanda&apos;s notarial professionals.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: Fingerprint, label: "Biometric client identification" },
              { icon: FolderOpen,  label: "Complete dossier management" },
              { icon: ShieldCheck, label: "Invitation-only secure access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-white/8">
                  <Icon size={15} className="text-brand-400" />
                </div>
                <span className="text-sm text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} NFS. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col bg-slate-900 px-5 py-12 sm:px-10">

        {/* mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <FileText size={15} className="text-white" />
            </span>
            <span className="text-white text-lg">NFS</span>
          </Link>
        </div>

        {/* centered form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

    </div>
  );
}
