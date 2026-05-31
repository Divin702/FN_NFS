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
            A secure platform for notaries and administrators to manage dossiers and clients.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-brand-600 hover:bg-brand-50 active:bg-brand-100 shadow-md"
                rightIcon={<ArrowRight size={16} />}
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
