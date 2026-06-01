import Link from "next/link";
import { ArrowRight, Fingerprint, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const stats = [
  { value: "100%", label: "Paperless Workflow" },
  { value: "24/7", label: "Secure Access" },
  { value: "Real-time", label: "Dossier Tracking" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      {/* dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-brand-200) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.3,
        }}
      />
      {/* glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 h-125 w-125 rounded-full bg-brand-100 opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-100 w-100 rounded-full bg-brand-50 opacity-60 blur-3xl"
      />

      <Container className="relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
              Notarial Services,{" "}
              <span className="text-brand-500">Fully Digital</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-lg">
              NFS digitises every step of the notarial workflow from dossier
              creation and client registration to document certification and
              biometric identification.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  rightIcon={<ArrowRight size={16} />}
                  className="shadow-md"
                >
                  Sign In to Your Account
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-muted hover:text-foreground"
                >
                  See how it works
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-10 flex flex-wrap gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-brand-500">{s.value}</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — illustrated dashboard preview */}
          <div className="hidden lg:block">
            <div className="relative rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
              {/* Fake topbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted font-mono">
                  NFS Dashboard
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Dossiers",
                      val: "128",
                      color: "bg-brand-50 text-brand-600",
                    },
                    {
                      label: "Clients",
                      val: "84",
                      color: "bg-violet-50 text-violet-600",
                    },
                    {
                      label: "Completed",
                      val: "61",
                      color: "bg-green-50 text-green-600",
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="rounded-xl border border-border p-3 text-center"
                    >
                      <div
                        className={`mx-auto mb-1.5 h-7 w-7 rounded-lg flex items-center justify-center ${c.color}`}
                      >
                        <FileText size={13} />
                      </div>
                      <p className="text-lg font-bold text-foreground leading-none">
                        {c.val}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Fake dossier rows */}
                <div className="rounded-xl border border-border overflow-hidden">
                  {[
                    {
                      num: "NFS-2025-00041",
                      name: "Uwimana Jean",
                      status: "In Progress",
                      color: "bg-amber-50 text-amber-700",
                    },
                    {
                      num: "NFS-2025-00040",
                      name: "Mukamana Alice",
                      status: "Completed",
                      color: "bg-green-50 text-green-700",
                    },
                    {
                      num: "NFS-2025-00039",
                      name: "Habimana Pierre",
                      status: "Open",
                      color: "bg-blue-50 text-blue-700",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-brand-600">
                          {row.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {row.num}
                        </p>
                        <p className="text-[10px] text-muted truncate">
                          {row.name}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${row.color}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Fingerprint badge */}
                <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
                    <Fingerprint size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-700">
                      Client identified
                    </p>
                    <p className="text-[10px] text-brand-500">
                      Fingerprint matched · NFS-2025-00041
                    </p>
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
