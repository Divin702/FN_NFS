"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  Bell,
  Menu,
  PanelLeftOpen,
  Lock,
  LogOut,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { useSidebar } from "@/components/providers/SidebarProvider";
import { ChangePasswordModal } from "./ChangePasswordModal";

const roleLabel: Record<string, string> = {
  citizen: "Citizen",
  legal_clerk: "Legal Clerk",
  notary_public: "Notary Public",
  administrator: "Administrator",
};

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startTransition(() => setUser(getUser()));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const avatarUrl = user?.picture;

  return (
    <>
      <header className="h-16 flex items-center justify-between px-5 sm:px-6 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-1.5 text-muted hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex p-1.5 rounded-md text-muted hover:bg-surface hover:text-foreground transition-colors"
          >
            <PanelLeftOpen
              size={18}
              style={{
                transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 200ms",
              }}
            />
          </button>

          <h1 className="text-base font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-muted hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface transition-colors"
                aria-expanded={menuOpen ? "true" : "false"}
                aria-haspopup="menu"
              >
                {avatarUrl ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-semibold">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                )}
                <div className="hidden sm:block leading-tight text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted">
                    {roleLabel[user.role] ?? user.role}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`hidden sm:block text-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-white shadow-lg py-1 z-50"
                >
                  {/* Identity header */}
                  <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border">
                    {avatarUrl ? (
                      <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-semibold">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
                    >
                      <UserCircle size={14} className="text-muted shrink-0" />
                      My Profile
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setChangePwOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
                    >
                      <Lock size={14} className="text-muted shrink-0" />
                      Change Password
                    </button>
                  </div>

                  <div className="border-t border-border pt-1">
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} className="shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {changePwOpen && (
        <ChangePasswordModal onClose={() => setChangePwOpen(false)} />
      )}
    </>
  );
}
