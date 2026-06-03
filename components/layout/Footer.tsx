import Link from "next/link";
import { FileText } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-slate-950">
      <Container>
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <FileText size={13} className="text-white" />
            </span>
            <span className="text-white text-sm">NFS — Notary File System</span>
          </div>

          <nav className="flex items-center gap-5 text-sm text-slate-500">
            <Link href="#features" className="hover:text-slate-300 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-slate-300 transition-colors">How It Works</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </nav>

          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} NFS. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
