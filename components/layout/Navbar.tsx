"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, FileText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

const links = [
  { label: "Features",    href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/8">
      <Container>
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <FileText size={15} className="text-white" />
            </span>
            <span className="text-white text-lg tracking-tight">NFS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Sign In
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-200 border-t border-white/8 bg-slate-900",
        open ? "max-h-64" : "max-h-0",
      )}>
        <Container>
          <div className="flex flex-col py-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="py-2.5 text-sm text-slate-400 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/8 mt-2">
              <Link
                href="/login"
                className="block w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white text-center"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}
