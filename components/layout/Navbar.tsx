"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";

const links = [
  { label: "About",        href: "#about"       },
  { label: "Services",     href: "#services"    },
  { label: "Features",     href: "#features"    },
  { label: "How It Works", href: "#how-it-works" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#103060] border-b border-white/10">
      <Container>
        <div className="flex h-16 items-center justify-between">

          <Link href="/" aria-label="NFS Home">
            <Logo variant="full" onDark size={30} />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Link
              href="/login"
              className="rounded-lg bg-white hover:bg-white/90 px-4 py-2 text-sm font-semibold text-[#103060] transition-colors"
            >
              Sign In
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-200 border-t border-white/10 bg-[#0d2750]",
        open ? "max-h-64" : "max-h-0",
      )}>
        <Container>
          <div className="flex flex-col py-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="py-2.5 text-sm text-white/60 hover:text-white font-medium"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 mt-2">
              <Link
                href="/login"
                className="block w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#103060] text-center"
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
