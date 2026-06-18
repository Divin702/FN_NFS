"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Search, ClipboardList, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getUser, clearAuth, isLoggedIn } from "@/lib/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/client",          icon: LayoutDashboard, label: "Overview"   },
  { href: "/client/notaries", icon: Search,          label: "Find Notary" },
  { href: "/client/requests", icon: ClipboardList,   label: "My Requests" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  const user = getUser();

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-[#103060] shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <Link href="/client" className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <FileText size={14} className="text-white" />
            </span>
            <span className="text-white font-bold text-lg tracking-tight">NFS</span>
            <span className="hidden sm:block text-white/40 text-xs ml-1">Client Portal</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-white/60">
              {user?.firstName}
            </span>
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
            <button
              className="sm:hidden text-white/70 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 px-4 py-3 space-y-1">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
