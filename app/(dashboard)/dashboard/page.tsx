"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FolderOpen,
  Clock,
  UserCheck,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  dossiersApi,
  dossiersKeys,
  type DossierStatus,
} from "@/lib/dossiers-api";
import { clientsApi, clientsKeys } from "@/lib/clients-api";
import { usersApi, usersKeys } from "@/lib/users-api";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  DossierStatus,
  { label: string; color: string; bg: string; text: string; dot: string }
> = {
  open: {
    label: "Open",
    color: "#3b82f6",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "In Progress",
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "#22c55e",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    color: "#d1d5db",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

function initials(f: string, l: string) {
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();
}

// ── Period helpers ────────────────────────────────────────────────────────────

type Period = "today" | "7d" | "30d" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  month: "This month",
  all: "All time",
};

function periodToDates(p: Period): { dateFrom?: string; dateTo?: string } {
  if (p === "all") return {};
  const now = new Date();
  const from = new Date(now);
  if (p === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (p === "7d") {
    from.setDate(now.getDate() - 7);
  } else if (p === "30d") {
    from.setDate(now.getDate() - 30);
  } else if (p === "month") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }
  return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────

interface Slice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  const r = 54;
  const cx = 72;
  const cy = 72;
  const circ = 2 * Math.PI * r;

  if (total === 0)
    return (
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="22"
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9ca3af"
          fontSize="11"
        >
          No data
        </text>
      </svg>
    );

  type Seg = Slice & { dash: number; rot: number };
  const segments: Seg[] = slices
    .filter((s) => s.value > 0)
    .reduce<{ list: Seg[]; cum: number }>(
      ({ list, cum }, s) => {
        const pct = s.value / total;
        return {
          list: [...list, { ...s, dash: pct * circ, rot: cum * 360 - 90 }],
          cum: cum + pct,
        };
      },
      { list: [], cum: 0 },
    ).list;

  return (
    <svg width="144" height="144" viewBox="0 0 144 144">
      {segments.map((s) => (
        <circle
          key={s.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="22"
          strokeDasharray={`${s.dash} ${circ}`}
          style={{
            transform: `rotate(${s.rot}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      ))}
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        fill="#111827"
        fontSize="22"
        fontWeight="700"
      >
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#9ca3af" fontSize="11">
        Total
      </text>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  loading,
  allTime = false,
}: {
  label: string;
  value?: number;
  icon: React.ElementType;
  iconBg: string;
  loading: boolean;
  allTime?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          iconBg,
        )}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {loading ? (
            <span className="inline-block h-7 w-10 rounded-md bg-surface animate-pulse" />
          ) : (
            (value ?? 0)
          )}
        </p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
        {allTime && (
          <p className="text-[10px] text-muted/60 mt-0.5">All time</p>
        )}
      </div>
    </div>
  );
}

// ── Period Pills (inline) ─────────────────────────────────────────────────────

function PeriodPills({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            period === p
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = getUser();
  const isAdmin = user?.role === "administrator";

  const [greeting] = useState(() => {
    if (typeof window === "undefined") return "";
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  });

  const [period, setPeriod] = useState<Period>("all");
  const dateParams = periodToDates(period);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: dossiersKeys.stats(dateParams),
    queryFn: () => dossiersApi.stats(dateParams),
  });
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: clientsKeys.list({ limit: 1 }),
    queryFn: () => clientsApi.list({ limit: 1 }),
  });
  const { data: recentDossiers, isLoading: dossiersLoading } = useQuery({
    queryKey: [...dossiersKeys.lists(), "dash", dateParams],
    queryFn: () => dossiersApi.list({ limit: 6, ...dateParams }),
  });
  const { data: recentClients, isLoading: clientsListLoad } = useQuery({
    queryKey: clientsKeys.list({ limit: 5 }),
    queryFn: () => clientsApi.list({ limit: 5 }),
  });
  const { data: activeUsers } = useQuery({
    queryKey: usersKeys.list({ status: "active", limit: 1 }),
    queryFn: () => usersApi.getAll({ status: "active", limit: 1 }),
    enabled: isAdmin,
  });
  const { data: pendingUsers } = useQuery({
    queryKey: usersKeys.list({ status: "pending", limit: 1 }),
    queryFn: () => usersApi.getAll({ status: "pending", limit: 1 }),
    enabled: isAdmin,
  });

  const totalClients = clientsData?.total ?? 0;
  const dossiersTotal = stats?.total ?? 0;

  const donutSlices: Slice[] = stats
    ? [
        { label: "Open", value: stats.open, color: STATUS_CFG.open.color },
        {
          label: "In Progress",
          value: stats.inProgress,
          color: STATUS_CFG.in_progress.color,
        },
        {
          label: "Completed",
          value: stats.completed,
          color: STATUS_CFG.completed.color,
        },
        {
          label: "Archived",
          value: stats.archived,
          color: STATUS_CFG.archived.color,
        },
      ]
    : [];

  const periodLabel = PERIOD_LABELS[period].toLowerCase();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Overview" />

      <main className="flex-1 overflow-auto p-5 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* ── Greeting + CTA ── */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {greeting}
                {greeting ? "," : ""} {user?.firstName} 👋
              </h1>
              <p className="text-sm text-muted mt-0.5">
                {isAdmin
                  ? "Overview of the entire NFS platform."
                  : "Your notarial activity at a glance."}
              </p>
            </div>
            <Link
              href="/dashboard/dossiers/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus size={15} /> New Dossier
            </Link>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isAdmin ? (
              <>
                <StatCard
                  label="Total Clients"
                  value={totalClients}
                  icon={Users}
                  iconBg="bg-brand-50 text-brand-600"
                  loading={clientsLoading}
                  allTime
                />
                <StatCard
                  label="Total Users"
                  value={(activeUsers?.total ?? 0) + (pendingUsers?.total ?? 0)}
                  icon={UserCheck}
                  iconBg="bg-violet-50 text-violet-600"
                  loading={!activeUsers || !pendingUsers}
                  allTime
                />
                <StatCard
                  label="Active Users"
                  value={activeUsers?.total}
                  icon={UserCheck}
                  iconBg="bg-emerald-50 text-emerald-600"
                  loading={!activeUsers}
                  allTime
                />
                <StatCard
                  label="Pending Invites"
                  value={pendingUsers?.total}
                  icon={Clock}
                  iconBg="bg-amber-50 text-amber-600"
                  loading={!pendingUsers}
                  allTime
                />
              </>
            ) : (
              <>
                <StatCard
                  label="My Open Dossiers"
                  value={stats?.open}
                  icon={FolderOpen}
                  iconBg="bg-blue-50 text-blue-600"
                  loading={statsLoading}
                />
                <StatCard
                  label="In Progress"
                  value={stats?.inProgress}
                  icon={Clock}
                  iconBg="bg-amber-50 text-amber-600"
                  loading={statsLoading}
                />
                <StatCard
                  label="Completed"
                  value={stats?.completed}
                  icon={UserCheck}
                  iconBg="bg-emerald-50 text-emerald-600"
                  loading={statsLoading}
                />
                <StatCard
                  label="My Clients"
                  value={totalClients}
                  icon={Users}
                  iconBg="bg-brand-50 text-brand-600"
                  loading={clientsLoading}
                  allTime
                />
              </>
            )}
          </div>

          {/* ── Dossier section (period-filtered) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Dossiers list */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Recent Dossiers
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    {statsLoading
                      ? "Loading…"
                      : `${dossiersTotal} dossier${dossiersTotal !== 1 ? "s" : ""} · ${periodLabel}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <PeriodPills period={period} onChange={setPeriod} />
                  <Link
                    href="/dashboard/dossiers"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {dossiersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="h-9 w-9 rounded-lg bg-surface shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-36 bg-surface rounded" />
                        <div className="h-2.5 w-24 bg-surface rounded" />
                      </div>
                      <div className="h-5 w-20 bg-surface rounded-full" />
                    </div>
                  ))}
                </div>
              ) : !recentDossiers?.data?.length ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="h-14 w-14 rounded-xl bg-surface flex items-center justify-center mb-3">
                    <FolderOpen size={24} className="text-muted" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No dossiers for {periodLabel}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Try a different time range or create a new dossier.
                  </p>
                  <Link
                    href="/dashboard/dossiers/new"
                    className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Create dossier →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentDossiers.data.map((d) => {
                    const cfg = STATUS_CFG[d.status];
                    return (
                      <Link
                        key={d.id}
                        href={`/dashboard/dossiers/${d.id}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface transition-colors group"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-brand-600 transition-colors">
                            {d.number}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {d.serviceName ?? "No service"} ·{" "}
                            {d.client?.firstName} {d.client?.lastName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {d.totalFee != null && (
                            <span className="hidden sm:block text-sm font-semibold text-foreground">
                              {d.totalFee.toLocaleString("en-RW")} RWF
                            </span>
                          )}
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              cfg.bg,
                              cfg.text,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Donut — same period filter */}
            <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Dossier Status
                </h2>
                <p className="text-xs text-muted mt-0.5 capitalize">
                  {periodLabel}
                </p>
              </div>

              <div className="flex justify-center my-3">
                {statsLoading ? (
                  <div className="h-36 w-36 rounded-full border-20 border-surface animate-pulse" />
                ) : (
                  <DonutChart slices={donutSlices} />
                )}
              </div>

              <div className="mt-auto space-y-2.5 pt-3 border-t border-border">
                {(
                  [
                    "open",
                    "in_progress",
                    "completed",
                    "archived",
                  ] as DossierStatus[]
                ).map((s) => {
                  const cfg = STATUS_CFG[s];
                  const val = !stats
                    ? 0
                    : s === "open"
                      ? stats.open
                      : s === "in_progress"
                        ? stats.inProgress
                        : s === "completed"
                          ? stats.completed
                          : stats.archived;
                  const pct = dossiersTotal
                    ? Math.round((val / dossiersTotal) * 100)
                    : 0;
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0",
                            cfg.dot,
                          )}
                        />
                        <span className="text-xs text-muted">{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {statsLoading ? "—" : val}
                        </span>
                        <span className="text-xs text-muted w-8 text-right">
                          {statsLoading ? "" : `${pct}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Recent Clients ── */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Recent Clients
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {clientsLoading ? "Loading…" : `${totalClients} total`}
                </p>
              </div>
              <Link
                href="/dashboard/clients"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View all →
              </Link>
            </div>

            {clientsListLoad ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 animate-pulse"
                  >
                    <div className="h-10 w-10 rounded-full bg-surface shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-20 bg-surface rounded" />
                      <div className="h-2.5 w-14 bg-surface rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !recentClients?.data?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users size={28} className="text-muted mb-2" />
                <p className="text-sm text-muted">No clients registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {recentClients.data.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/clients/${c.id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface transition-colors group"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-brand-100 border border-border overflow-hidden flex items-center justify-center">
                      {c.photoUrl ? (
                        <Image
                          src={c.photoUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-brand-600">
                          {initials(c.firstName, c.lastName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-brand-600 transition-colors">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-muted font-mono truncate">
                        {c.nationalId}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Quick Actions ── */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div
              className={cn(
                "grid gap-3",
                isAdmin
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3",
              )}
            >
              {(isAdmin
                ? [
                    {
                      label: "New Dossier",
                      href: "/dashboard/dossiers/new",
                      icon: FolderOpen,
                      cls: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
                    },
                    {
                      label: "Register Client",
                      href: "/dashboard/clients",
                      icon: Users,
                      cls: "border border-border bg-white text-foreground hover:bg-surface",
                    },
                    {
                      label: "Invite User",
                      href: "/dashboard/users",
                      icon: UserCheck,
                      cls: "border border-border bg-white text-foreground hover:bg-surface",
                    },
                    {
                      label: "New Template",
                      href: "/dashboard/templates",
                      icon: FileText,
                      cls: "border border-border bg-white text-foreground hover:bg-surface",
                    },
                  ]
                : [
                    {
                      label: "New Dossier",
                      href: "/dashboard/dossiers/new",
                      icon: FolderOpen,
                      cls: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
                    },
                    {
                      label: "Clients",
                      href: "/dashboard/clients",
                      icon: Users,
                      cls: "border border-border bg-white text-foreground hover:bg-surface",
                    },
                    {
                      label: "My Dossiers",
                      href: "/dashboard/dossiers",
                      icon: FileText,
                      cls: "border border-border bg-white text-foreground hover:bg-surface",
                    },
                  ]
              ).map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    a.cls,
                  )}
                >
                  <a.icon size={16} className="shrink-0" /> {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
