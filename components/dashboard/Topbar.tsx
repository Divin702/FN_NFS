"use client";

import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { getUser, type AuthUser } from "@/lib/auth";

const roleLabel: Record<string, string> = {
  citizen:       "Citizen",
  legal_clerk:   "Legal Clerk",
  notary_public: "Notary Public",
  administrator: "Administrator",
};

export function Topbar({ title }: { title: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  return (
    <header className="h-16 flex items-center justify-between px-5 sm:px-6 bg-white border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <button type="button" className="md:hidden p-1.5 text-muted hover:text-foreground">
          <Menu size={18} />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="p-1.5 text-muted hover:text-foreground transition-colors">
          <Bell size={18} />
        </button>

        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted">{roleLabel[user.role] ?? user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
