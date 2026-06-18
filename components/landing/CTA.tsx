import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function CTA() {
  return (
    <section className="py-24 bg-[#103060] border-t border-white/10">
      <Container>
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 mb-7">
            <Lock size={11} className="text-white/60" />
            <span className="text-xs font-medium text-white/60 tracking-wide">
              Authorised personnel only
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-4 text-white/50 text-base leading-relaxed">
            Sign in to access your notarial workspace — dossiers, clients,
            documents, and more.
          </p>

          <div className="mt-9">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-white hover:bg-white/90 px-7 py-3.5 text-sm font-semibold text-[#103060] transition-colors duration-150"
            >
              Sign In to NFS
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
