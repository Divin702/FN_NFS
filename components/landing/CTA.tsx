import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CTA() {
  return (
    <section className="py-20 bg-brand-500 relative overflow-hidden">
      {/* subtle glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"
      />

      <Container className="relative">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-3 text-brand-100 text-base">
            Sign in to access your notarial workspace dossiers, clients,
            documents, and more.
          </p>

          <div className="mt-8">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-brand-600 hover:bg-brand-50 active:bg-brand-100 shadow-lg"
                rightIcon={<ArrowRight size={16} />}
              >
                Sign In to NFS
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
