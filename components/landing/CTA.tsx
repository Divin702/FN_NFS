import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CTA() {
  return (
    <section className="py-20 bg-brand-500">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-3 text-brand-100 text-base max-w-md mx-auto">
            Join thousands of citizens already managing their notarial documents
            securely on NFS.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-brand-600 hover:bg-brand-50 active:bg-brand-100 shadow-md"
                rightIcon={<ArrowRight size={16} />}
              >
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-brand-600 active:bg-brand-700"
              >
                Already have an account? Sign in
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
