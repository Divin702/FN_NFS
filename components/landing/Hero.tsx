"use client";

import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  ShieldCheck,
  FolderOpen,
  Users,
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#103060] pt-20 pb-0 sm:pt-28">
      {/* subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-175 h-100 opacity-15 blur-3xl rounded-full"
        style={{ background: "white" }}
      />

      <Container className="relative">
        {/* ── Copy ── */}
        <div className="max-w-2xl mx-auto text-center pb-16 sm:pb-24">
          {/* headline */}
          <h1 className="text-[2.8rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
            <span className="text-white">Document notarization,</span>
            <br />
            <span className="text-white/40">made simple.</span>
          </h1>
          <p className="mt-6 text-base sm:text-[1.05rem] text-white/50 leading-relaxed max-w-md mx-auto">
            Choose a notary, submit your documents, and track every step — all
            from one secure platform built for Rwanda.
          </p>
          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#103060] hover:bg-white/94 transition-colors shadow-xl shadow-black/20"
            >
              Get Started Free
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-white/15 px-7 py-3.5 text-sm font-medium text-white/65 hover:text-white hover:border-white/30 transition-colors"
            >
              Staff Sign In
            </Link>
          </div>
          {/* trust */}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-white/25">
            <ShieldCheck size={11} />
            No credit card · Biometric verification · End-to-end encrypted
          </p>
          {/* stats — horizontal, minimal */}
          <div className="mt-12 pt-10 border-t border-white/8 flex items-center justify-center gap-8 sm:gap-12">
            {[
              { value: "100%", label: "Paperless" },
              { value: "24/7", label: "Available" },
              { value: "< 1s", label: "Biometric ID" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-8 sm:gap-12">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {s.value}
                  </p>
                  <p className="text-[10px] font-medium text-white/35 mt-1 tracking-wide uppercase">
                    {s.label}
                  </p>
                </div>
                {i < 2 && <div className="w-px h-8 bg-white/10 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Product mockup ── */}
        <div className="relative mx-auto max-w-4xl">
          {/* glow behind mockup */}
          <div
            aria-hidden
            className="absolute -inset-x-10 -top-8 h-16 blur-3xl opacity-20"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)",
            }}
          />

          {/* browser shell */}
          <div className="rounded-t-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            {/* browser chrome */}
            <div className="flex items-center gap-3 bg-[#0c2448] px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 bg-white/6 border border-white/8 rounded-md px-3 py-1 max-w-xs w-full">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] text-white/35 font-mono truncate">
                    nfs.rw/dashboard
                  </span>
                </div>
              </div>
              <div className="w-14" />
            </div>

            {/* ── App interior (white/light) ── */}
            <div className="bg-[#f5f7fa]">
              {/* App top nav */}
              <div className="bg-[#103060] flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-sm tracking-tight">
                    NFS
                  </span>
                  <span className="hidden sm:block h-4 w-px bg-white/15" />
                  {["Overview", "Dossiers", "Clients", "Requests"].map(
                    (item, i) => (
                      <span
                        key={item}
                        className={`text-[11px] font-medium hidden sm:block ${i === 0 ? "text-white" : "text-white/40"}`}
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">EN</span>
                  </div>
                </div>
              </div>

              {/* App content */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Greeting */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-[#103060]">
                      Good morning, Rugwiza
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Your notarial activity at a glance.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#103060] px-3 py-1.5">
                    <span className="text-[10px] font-semibold text-white">
                      + New Dossier
                    </span>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    {
                      icon: FolderOpen,
                      label: "Dossiers",
                      val: "128",
                      sub: "+4 this week",
                      color: "text-[#103060]",
                      bg: "bg-[#103060]/8",
                    },
                    {
                      icon: Users,
                      label: "Clients",
                      val: "84",
                      sub: "+2 today",
                      color: "text-violet-600",
                      bg: "bg-violet-50",
                    },
                    {
                      icon: CheckCircle2,
                      label: "Completed",
                      val: "61",
                      sub: "this month",
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      icon: ClipboardList,
                      label: "Requests",
                      val: "17",
                      sub: "3 pending",
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                    },
                  ].map(({ icon: Icon, label, val, sub, color, bg }) => (
                    <div
                      key={label}
                      className="bg-white rounded-xl border border-gray-100 p-2.5 sm:p-3"
                    >
                      <div
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${bg} mb-2`}
                      >
                        <Icon size={12} className={color} />
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {label}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 leading-tight mt-0.5">
                        {val}
                      </p>
                      <p className="text-[9px] text-gray-300 mt-0.5 hidden sm:block">
                        {sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Dossier table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                    <span className="text-[11px] font-semibold text-gray-700">
                      Recent Dossiers
                    </span>
                    <span className="text-[10px] text-[#103060] font-medium">
                      View all →
                    </span>
                  </div>
                  {[
                    {
                      num: "NFS-2026-00041",
                      name: "Uwimana Jean",
                      svc: "Deed Certification",
                      status: "Completed",
                      dot: "bg-emerald-400",
                      badge: "bg-emerald-50 text-emerald-700",
                    },
                    {
                      num: "NFS-2026-00040",
                      name: "Mukamana Alice",
                      svc: "Contract Drafting",
                      status: "Open",
                      dot: "bg-blue-400",
                      badge: "bg-blue-50 text-blue-700",
                    },
                    {
                      num: "NFS-2026-00039",
                      name: "Habimana Pierre",
                      svc: "Affidavit Preparation",
                      status: "Completed",
                      dot: "bg-emerald-400",
                      badge: "bg-emerald-50 text-emerald-700",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-4 py-2.5 ${i > 0 ? "border-t border-gray-50" : ""}`}
                    >
                      <div className="h-7 w-7 rounded-full bg-[#103060]/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-[#103060]">
                          {row.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 truncate">
                          {row.num}
                        </p>
                        <p className="text-[9px] text-gray-400 truncate">
                          {row.name} · {row.svc}
                        </p>
                      </div>
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${row.badge}`}
                      >
                        <span className={`h-1 w-1 rounded-full ${row.dot}`} />
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Fingerprint banner */}
                <div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-100 px-4 py-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#103060] flex items-center justify-center shrink-0">
                    <Fingerprint size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800">
                      Client identified via fingerprint
                    </p>
                    <p className="text-[9px] text-gray-400 truncate mt-0.5">
                      ARATEK A600 · Matched → Uwimana Jean · NFS-2026-00041
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 shrink-0">
                    <Clock size={9} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">
                      0.3s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* bottom fade into next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
        style={{ background: "linear-gradient(to top, #103060, transparent)" }}
      />
    </section>
  );
}
