import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function CTA() {
  return (
    <section className="py-24 bg-slate-950 border-t border-white/8">
      <Container>
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 mb-7">
            <Lock size={11} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400 tracking-wide">
              Authorised personnel only
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-4 text-slate-400 text-base leading-relaxed">
            Sign in to access your notarial workspace — dossiers, clients,
            documents, and more.
          </p>

          <div className="mt-9">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-150"
            >
              Sign In to NFS
              <ArrowRight
                size={15}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
