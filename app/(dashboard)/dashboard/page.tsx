"use client";

import { useQueries } from "@tanstack/react-query";
import { Users, UserCheck, Clock, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { usersApi, usersKeys } from "@/lib/users-api";

const STAT_CONFIGS = [
  { label: "Total Users",     status: undefined,   icon: Users,       color: "bg-brand-50 text-brand-600" },
  { label: "Active Users",    status: "active",    icon: UserCheck,   color: "bg-green-50 text-green-600" },
  { label: "Pending Invites", status: "pending",   icon: Clock,       color: "bg-amber-50 text-amber-600" },
  { label: "Disabled",        status: "disabled",  icon: ShieldAlert, color: "bg-red-50 text-red-600"     },
] as const;

export default function DashboardPage() {
  const results = useQueries({
    queries: STAT_CONFIGS.map(({ status }) => ({
      queryKey: usersKeys.list({ status, limit: 1 }),
      queryFn: () => usersApi.getAll({ status, limit: 1 }),
    })),
  });

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Overview" />
      <main className="flex-1 p-5 sm:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CONFIGS.map(({ label, icon: Icon, color }, i) => {
            const total = results[i].data?.total;
            return (
              <div key={label} className="bg-white rounded-lg border border-border p-5">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${color} mb-3`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {total === undefined ? "—" : total}
                </p>
                <p className="text-xs text-muted mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
