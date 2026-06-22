"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Search,
  ClipboardList,
  CalendarClock,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUser, clearAuth, isLoggedIn } from "@/lib/auth";
import { useRequestNotifications } from "@/lib/use-request-notifications";
import { cn } from "@/lib/cn";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(true);
    }
  }, [router]);

  const { unread } = useRequestNotifications();

  if (!checked) return null;

  const user = getUser();

  const NAV = [
    { href: "/client", icon: LayoutDashboard, label: "Overview", badge: 0 },
    { href: "/client/notaries", icon: Search, label: "Find Notary", badge: 0 },
    {
      href: "/client/requests",
      icon: ClipboardList,
      label: "My Requests",
      badge: unread,
    },
    {
      href: "/client/appointments",
      icon: CalendarClock,
      label: "Appointments",
      badge: 0,
    },
  ];

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-[#103060] shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Logo */}
          <Link href="/client" className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <FileText size={14} className="text-white" />
            </span>
            <span className="text-white font-bold text-lg tracking-tight">
              NFS
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ href, icon: Icon, label, badge }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white text-[#103060] shadow-sm"
                      : "text-white/65 hover:text-white",
                  )}
                >
                  <Icon size={14} />
                  {label}
                  {badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-white font-bold truncate max-w-25">
              {user?.firstName}
            </span>
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/65 hover:text-white transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>

            {/* Mobile: badge on hamburger if unread */}
            <div className="relative sm:hidden">
              <button
                type="button"
                className="text-white/85 hover:text-white"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {unread > 0 && !menuOpen && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 px-4 py-3 space-y-0.5">
            {NAV.map(({ href, icon: Icon, label, badge }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white text-[#103060] font-semibold"
                      : "text-white/65 hover:text-white",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} />
                    {label}
                  </span>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-white/65 hover:text-white transition-colors"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
