"use client";

import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  CheckCircle2,
  Clock,
  FolderOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#103060] pt-20 pb-0 sm:pt-28">
      {/* dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* radial glow behind headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-175 h-100 opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, transparent 70%)",
        }}
      />

      <Container className="relative">
        <div className="max-w-2xl mx-auto text-center pb-14 sm:pb-20">
          {/* badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 mb-8">
            <Sparkles size={12} className="text-white/60" />
            <span className="text-xs font-semibold text-white/70 tracking-wide">
              Rwanda&apos;s Digital Notary Platform
            </span>
          </div>

          {/* heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-[4.2rem] font-bold leading-[1.07] tracking-tight text-white">
            Notarize your
            <br />
            <span
              className="relative inline-block"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              documents online.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/55 leading-relaxed max-w-lg mx-auto">
            Choose a notary, submit your request, and track every step — without
            leaving your home. Secure, transparent, built for Rwanda.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-white/92 px-7 py-3.5 text-sm font-bold text-[#103060] transition-all duration-150 shadow-lg shadow-black/25"
            >
              Get Started — It&apos;s Free
              <ArrowRight
                size={15}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-150"
            >
              Staff Sign In
            </Link>
          </div>

          {/* trust line */}
          <p className="mt-5 text-xs text-white/30 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-white/30" />
            No credit card required · Biometric verification · 256-bit encrypted
          </p>

          {/* stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-10">
            {[
              {
                value: "100%",
                label: "Paperless",
                sub: "No physical visits needed",
              },
              {
                value: "24/7",
                label: "Available",
                sub: "Submit anytime, anywhere",
              },
              {
                value: "< 1s",
                label: "Biometrics",
                sub: "ARATEK A600 fingerprint",
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {s.value}
                </p>
                <p className="text-xs font-semibold text-white/60 mt-1">
                  {s.label}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5 hidden sm:block">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dashboard preview ── */}
        <div className="relative mx-auto max-w-4xl">
          {/* glow under card */}
          <div
            aria-hidden
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-2/3 h-12 blur-3xl opacity-25"
            style={{ background: "rgba(255,255,255,0.2)" }}
          />

          <div className="rounded-t-2xl border border-white/15 border-b-0 bg-white/6 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
            {/* browser chrome */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/8 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-white/45 font-mono">
                  nfs.rw/dashboard
                </span>
              </div>
              <div className="w-16" />
            </div>

            {/* dashboard body */}
            <div className="p-5 grid grid-cols-12 gap-4">
              {/* sidebar */}
              <div className="col-span-2 flex flex-col gap-0.5">
                {[
                  { icon: FolderOpen, label: "Dossiers", active: true },
                  { icon: Fingerprint, label: "Clients", active: false },
                  { icon: CheckCircle2, label: "Requests", active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                      active ? "bg-white/15" : ""
                    }`}
                  >
                    <Icon
                      size={12}
                      className={active ? "text-white" : "text-white/35"}
                    />
                    <span
                      className={`text-[10px] font-medium ${
                        active ? "text-white" : "text-white/35"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* main area */}
              <div className="col-span-10 space-y-3.5">
                {/* stat cards */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { label: "Dossiers", val: "128", trend: "+4 this week" },
                    { label: "Clients", val: "84", trend: "+2 today" },
                    { label: "Completed", val: "61", trend: "this month" },
                    { label: "Requests", val: "17", trend: "3 pending" },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="rounded-xl border border-white/10 bg-white/6 p-3"
                    >
                      <p className="text-[10px] text-white/40 font-medium">
                        {c.label}
                      </p>
                      <p className="text-xl font-bold text-white mt-0.5">
                        {c.val}
                      </p>
                      <p className="text-[9px] text-white/28 mt-0.5">
                        {c.trend}
                      </p>
                    </div>
                  ))}
                </div>

                {/* dossier rows */}
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/4">
                    <span className="text-[11px] font-semibold text-white/55">
                      Recent Dossiers
                    </span>
                    <span className="text-[10px] text-white/25 cursor-pointer hover:text-white/50 transition-colors">
                      View all →
                    </span>
                  </div>
                  {[
                    {
                      num: "NFS-2026-00041",
                      name: "Uwimana Jean",
                      service: "Deed Certification",
                      status: "Completed",
                      dot: "bg-emerald-400",
                    },
                    {
                      num: "NFS-2026-00040",
                      name: "Mukamana Alice",
                      service: "Contract Drafting",
                      status: "Open",
                      dot: "bg-blue-400",
                    },
                    {
                      num: "NFS-2026-00039",
                      name: "Habimana Pierre",
                      service: "Affidavit Preparation",
                      status: "Completed",
                      dot: "bg-emerald-400",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2.5 ${
                        i > 0 ? "border-t border-white/6" : ""
                      }`}
                    >
                      <div className="h-7 w-7 rounded-full bg-white/12 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white/70">
                          {row.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white/85 truncate">
                          {row.num}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">
                          {row.name} · {row.service}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${row.dot}`}
                        />
                        <span className="text-[10px] text-white/45 font-medium">
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* fingerprint status bar */}
                <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5">
                  <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Fingerprint size={16} className="text-[#103060]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white">
                      Client identified via fingerprint
                    </p>
                    <p className="text-[10px] text-white/35 mt-0.5 truncate">
                      ARATEK A600 · Matched → Uwimana Jean · NFS-2026-00041
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 shrink-0">
                    <Clock size={9} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold">
                      0.3s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
