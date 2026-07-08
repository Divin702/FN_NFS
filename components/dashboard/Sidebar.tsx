"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Users,
  LayoutDashboard,
  LogOut,
  FolderOpen,
  BookTemplate,
  ChevronLeft,
  UserCircle,
  Briefcase,
  ClipboardList,
  CalendarClock,
  FileBarChart2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearAuth, getUser } from "@/lib/auth";
import { startTransition, useEffect, useState } from "react";
import type { Role } from "@/lib/auth";
import { useSidebar } from "@/components/providers/SidebarProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const nav: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["administrator", "notary_public"],
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
    roles: ["administrator", "notary_public"],
  },
  {
    label: "Dossiers",
    href: "/dashboard/dossiers",
    icon: FolderOpen,
    roles: ["administrator", "notary_public"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ["administrator"],
  },
  {
    label: "Categories",
    href: "/dashboard/categories",
    icon: FolderOpen,
    roles: ["administrator"],
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: BookTemplate,
    roles: ["administrator", "notary_public"],
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: Briefcase,
    roles: ["administrator", "notary_public"],
  },
  {
    label: "Requests",
    href: "/dashboard/requests",
    icon: ClipboardList,
    roles: ["notary_public"],
  },
  {
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarClock,
    roles: ["notary_public"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileBarChart2,
    roles: ["administrator", "notary_public"],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    roles: ["administrator", "notary_public"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();
  const [role, setRole] = useState<Role | null>(null);

  // Read localStorage only after mount to avoid SSR/client mismatch
  useEffect(() => {
    startTransition(() => {
      const user = getUser();
      if (user) setRole(user.role);
    });
  }, []);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  const visibleNav = role
    ? nav.filter((item) => item.roles.includes(role))
    : [];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-white border-r border-border h-full",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-15" : "w-60",
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-border shrink-0">
        {collapsed ? (
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-full"
            aria-label="NFS Home"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
              <FileText size={14} />
            </span>
          </Link>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-brand-600"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500 text-white">
                <FileText size={14} />
              </span>
              <span className="tracking-tight whitespace-nowrap">NFS</span>
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="shrink-0 p-1 rounded-md text-muted hover:bg-surface hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-x-hidden overflow-y-auto">
        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                collapsed && "justify-center",
                active
                  ? "bg-brand-50 text-brand-600"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 shrink-0">
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium",
            "text-muted hover:bg-red-50 hover:text-red-600 transition-colors",
            collapsed && "justify-center",
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
