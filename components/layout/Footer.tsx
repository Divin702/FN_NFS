import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d2750]">
      <Container>
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="full" onDark size={26} />

          <nav className="flex items-center gap-5 text-sm text-white/40">
            <Link href="#about"        className="hover:text-white transition-colors">About</Link>
            <Link href="#services"     className="hover:text-white transition-colors">Services</Link>
            <Link href="#features"     className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/login"        className="hover:text-white transition-colors">Sign In</Link>
          </nav>

          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} NFS. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
