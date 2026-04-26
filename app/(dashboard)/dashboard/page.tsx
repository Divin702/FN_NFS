"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Clock, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { getUsers } from "@/lib/users-api";

interface Stat { label: string; value: string; icon: React.ElementType; color: string }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [all, active, pending, disabled] = await Promise.all([
          getUsers({}),
          getUsers({ status: "active" }),
          getUsers({ status: "pending" }),
          getUsers({ status: "disabled" }),
        ]);
        setStats([
          { label: "Total Users",      value: String(all.total),     icon: Users,       color: "bg-brand-50 text-brand-600"  },
          { label: "Active Users",     value: String(active.total),  icon: UserCheck,   color: "bg-green-50 text-green-600"  },
          { label: "Pending Invites",  value: String(pending.total), icon: Clock,       color: "bg-amber-50 text-amber-600"  },
          { label: "Disabled",         value: String(disabled.total),icon: ShieldAlert, color: "bg-red-50 text-red-600"      },
        ]);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Overview" />
      <main className="flex-1 p-5 sm:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-lg border border-border p-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${color} mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
