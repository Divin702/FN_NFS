import Link from "next/link";
import { ShieldCheck, Fingerprint, FolderOpen } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between bg-[#103060] p-12">
        <Link href="/" aria-label="NFS Home">
          <Logo variant="full" onDark size={32} />
        </Link>

        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Notary File System
            </p>
            <h2 className="text-2xl font-bold text-white leading-snug">
              A trusted digital platform for every notarial need in Rwanda.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Secure, transparent, and built for Rwanda&apos;s notarial professionals.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Fingerprint, label: "Biometric client identification" },
              { icon: FolderOpen,  label: "Complete dossier management"     },
              { icon: ShieldCheck, label: "Invitation-only secure access"   },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-sm text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/25">
          &copy; {new Date().getFullYear()} NFS. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col bg-white px-5 py-12 sm:px-10">
        <div className="lg:hidden mb-8">
          <Link href="/" aria-label="NFS Home">
            <Logo variant="full" size={28} />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

    </div>
  );
}
