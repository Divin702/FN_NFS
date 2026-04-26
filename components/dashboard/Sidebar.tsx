"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Users, LayoutDashboard, LogOut, FolderOpen, BookTemplate } from "lucide-react";
import { cn } from "@/lib/cn";
import { clearAuth, getUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const nav: NavItem[] = [
  { label: "Overview",    href: "/dashboard",            icon: LayoutDashboard, roles: ["administrator", "notary_public", "legal_clerk", "citizen"] },
  { label: "Users",       href: "/dashboard/users",      icon: Users,           roles: ["administrator"] },
  { label: "Categories",  href: "/dashboard/categories", icon: FolderOpen,      roles: ["administrator"] },
  { label: "Templates",   href: "/dashboard/templates",  icon: BookTemplate,    roles: ["administrator", "notary_public", "legal_clerk"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user) setRole(user.role);
  }, []);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  const visibleNav = role ? nav.filter((item) => item.roles.includes(role)) : [];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-border min-h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-brand-600">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
            <FileText size={14} />
          </span>
          <span className="tracking-tight">NFS</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-600"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
