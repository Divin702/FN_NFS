import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-32">
      {/* subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-brand-200) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />
      {/* blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-125 w-125 rounded-full bg-brand-100 opacity-50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-100 w-100 rounded-full bg-brand-50 opacity-60 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl sm:text-[3.25rem] font-bold text-foreground leading-[1.15] tracking-tight">
            Secure Notarial Services,{" "}
            <span className="text-brand-500">All in One Place</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto">
            NFS digitalises every step of the notarial workflow from document
            submission to legal certification keeping notaries perfectly in
            sync.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                rightIcon={<ArrowRight size={16} />}
                className="shadow-md"
              >
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                See how it works
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted">
            Citizens register instantly &nbsp;·&nbsp; Staff onboarded by
            invitation
          </p>
        </div>

        {/* stats row */}
        <div className="mx-auto mt-20 grid max-w-xl grid-cols-3 overflow-hidden rounded-xl border border-border bg-border gap-px shadow-sm">
          {[
            { value: "100%", label: "Secure & Encrypted" },
            { value: "24 / 7", label: "Document Access" },
          ].map((s) => (
            <div key={s.label} className="bg-white py-7 text-center">
              <p className="text-2xl font-bold text-brand-500">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
