import Link from "next/link";
import { FileText } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <Container>
        <div className="py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-brand-600 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
              <FileText size={14} />
            </span>
            <span>NFS – Notary File System</span>
          </div>

          <nav className="flex items-center gap-5 text-sm text-muted">
            <Link href="#about" className="hover:text-brand-600 transition-colors">About</Link>
            <Link href="#features" className="hover:text-brand-600 transition-colors">Features</Link>
            <Link href="/login" className="hover:text-brand-600 transition-colors">Sign In</Link>
          </nav>

          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} NFS. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
