"use client";

import Link from "next/link";
import { ArrowRight, Fingerprint, Shield, Zap } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* subtle top border */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-white/10"
      />

      <Container className="relative">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* ── Left copy ── */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight text-white">
              Notarial Services,{" "}
              <span className="text-brand-400">Fully Digital.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg">
              NFS digitises every step of the notarial workflow — dossier
              creation, client registration, biometric identification, and
              document certification.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150"
              >
                Sign In to Your Account
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-medium text-slate-300 transition-colors duration-150"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 border-t border-white/8 pt-8">
              {[
                { value: "100%", label: "Paperless Workflow" },
                { value: "24/7", label: "Secure Access" },
                { value: "Real-time", label: "Dossier Tracking" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: dashboard preview ── */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
              {/* topbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-slate-800/50">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  NFS — Dashboard
                </span>
                <div className="h-5 w-5 rounded-full bg-slate-700 border border-white/10" />
              </div>

              <div className="p-5 space-y-4">
                {/* stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Dossiers",
                      val: "128",
                      text: "text-brand-400",
                      bg: "bg-slate-800 border-slate-700",
                    },
                    {
                      label: "Clients",
                      val: "84",
                      text: "text-violet-400",
                      bg: "bg-slate-800 border-slate-700",
                    },
                    {
                      label: "Completed",
                      val: "61",
                      text: "text-emerald-400",
                      bg: "bg-slate-800 border-slate-700",
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className={`rounded-xl border p-3 text-center ${c.bg}`}
                    >
                      <p className={`text-lg font-bold ${c.text}`}>{c.val}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {c.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* dossier rows */}
                <div className="rounded-xl border border-slate-700/60 overflow-hidden">
                  {[
                    {
                      num: "NFS-2026-00041",
                      name: "Uwimana Jean",
                      status: "Completed",
                      c: "text-emerald-400 bg-emerald-500/10",
                    },
                    {
                      num: "NFS-2026-00040",
                      name: "Mukamana Alice",
                      status: "Open",
                      c: "text-blue-400 bg-blue-500/10",
                    },
                    {
                      num: "NFS-2026-00039",
                      name: "Habimana Pierre",
                      status: "Completed",
                      c: "text-emerald-400 bg-emerald-500/10",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 ${i > 0 ? "border-t border-slate-700/50" : ""}`}
                    >
                      <div className="h-7 w-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-brand-400">
                          {row.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {row.num}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {row.name}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${row.c}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* fingerprint badge */}
                <div className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-slate-800 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
                    <Fingerprint size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">
                      Client identified
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Fingerprint matched · NFS-2026-00041
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                </div>

                {/* pills */}
                <div className="flex gap-2">
                  {[
                    { icon: Shield, label: "Invitation Only" },
                    { icon: Zap, label: "Auto-fill Templates" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1"
                    >
                      <Icon size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
