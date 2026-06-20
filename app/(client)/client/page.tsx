"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Search,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  CalendarClock,
  FileText,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import {
  requestsApi,
  requestsKeys,
  STATUS_COLORS,
  STATUS_LABELS,
  type RequestStatus,
} from "@/lib/requests-api";
import {
  appointmentsApi,
  appointmentKeys,
  APPT_STATUS_COLORS,
  APPT_STATUS_LABELS,
} from "@/lib/appointments-api";
import { useRequestNotifications } from "@/lib/use-request-notifications";
import { cn } from "@/lib/cn";

function StatusBadge({ status }: { status: RequestStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function ClientDashboard() {
  const user = getUser();
  const { unread } = useRequestNotifications();

  const { data: requests, isLoading } = useQuery({
    queryKey: requestsKeys.lists(),
    queryFn: requestsApi.list,
    refetchInterval: 15_000,
  });

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: appointmentsApi.list,
    refetchInterval: 15_000,
  });

  const total = requests?.length ?? 0;
  const pending = requests?.filter((r) => r.status === "pending").length ?? 0;
  const accepted = requests?.filter((r) => r.status === "accepted").length ?? 0;

  const upcomingAppts = (appointments ?? [])
    .filter((a) => a.status === "confirmed" || a.status === "pending")
    .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate))
    .slice(0, 3);

  const recent = requests?.slice(0, 5) ?? [];

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const stats = [
    {
      label: "Total Requests",
      value: total,
      icon: ClipboardList,
      tile: "bg-[#103060]/10 text-[#103060]",
      num: "text-[#103060]",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      tile: "bg-amber-100 text-amber-600",
      num: "text-amber-600",
    },
    {
      label: "Accepted",
      value: accepted,
      icon: CheckCircle2,
      tile: "bg-emerald-100 text-emerald-600",
      num: "text-emerald-600",
    },
    {
      label: "Appointments",
      value: upcomingAppts.length,
      icon: CalendarClock,
      tile: "bg-violet-100 text-violet-600",
      num: "text-violet-600",
    },
  ];

  const initial = (user?.firstName?.[0] ?? "U").toUpperCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Notification banner */}
      {unread > 0 && (
        <Link
          href="/client/requests"
          className="flex items-center gap-3 rounded-2xl border border-[#103060]/15 bg-[#103060]/5 px-4 sm:px-5 py-3.5 hover:bg-[#103060]/10 transition-colors group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#103060]/10 group-hover:bg-[#103060]/20 transition-colors">
            <Bell size={16} className="text-[#103060]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#103060]">
              {unread === 1
                ? "1 request was updated"
                : `${unread} requests have new updates`}
            </p>
            <p className="text-xs text-[#103060]/50 mt-0.5">
              Tap to view your requests
            </p>
          </div>
          <ArrowRight
            size={15}
            className="text-[#103060]/40 group-hover:translate-x-0.5 transition-transform shrink-0"
          />
        </Link>
      )}

      {/* Hero — flat navy */}
      <div className="rounded-2xl bg-[#103060] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="hidden xs:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white text-lg font-bold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white uppercase tracking-widest mb-0.5">
                Client Portal
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {greeting}, {user?.firstName}
              </h1>
              <p className="text-xs text-white mt-0.5">
                Track and manage your notarization requests
              </p>
            </div>
          </div>
          <Link
            href="/client/notaries"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#103060] hover:bg-white/90 transition-colors shrink-0"
          >
            <Search size={14} /> Find a Notary
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, tile, num }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl mb-3.5",
                tile,
              )}
            >
              <Icon size={18} />
            </div>
            <p className={cn("text-2xl font-bold leading-none", num)}>
              {isLoading ? (
                <span className="inline-block h-6 w-7 rounded bg-gray-100 animate-pulse" />
              ) : (
                value
              )}
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:items-start">
        {/* Recent Requests — wider */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3.5 border-b border-gray-50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Recent Requests
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
            </div>
            <Link
              href="/client/requests"
              className="flex items-center gap-1 text-xs font-semibold text-[#103060] hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 sm:px-5 py-4 animate-pulse"
                >
                  <div className="h-9 w-9 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                    <div className="h-2.5 w-48 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : !recent.length ? (
            <div className="flex flex-col items-center py-12 text-center px-6">
              <div className="h-14 w-14 rounded-2xl bg-[#103060]/5 flex items-center justify-center mb-3">
                <FileText size={22} className="text-[#103060]/30" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                No requests yet
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-50">
                Find a notary and submit your first notarization request
              </p>
              <Link
                href="/client/notaries"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#103060] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0d2750] transition-colors"
              >
                <Search size={12} /> Browse notaries
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#103060]/5">
                    <ClipboardList size={15} className="text-[#103060]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {req.documentType}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {req.notary?.firstName} {req.notary?.lastName}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3.5 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Appointments</h2>
              <Link
                href="/client/appointments"
                className="flex items-center gap-1 text-xs font-semibold text-[#103060] hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {upcomingAppts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center px-5">
                <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                  <CalendarClock size={20} className="text-violet-400" />
                </div>
                <p className="text-xs font-semibold text-gray-600">
                  No upcoming appointments
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Book a visit with a notary
                </p>
                <Link
                  href="/client/notaries"
                  className="mt-3 text-xs font-semibold text-violet-600 hover:underline"
                >
                  Book one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingAppts.map((a) => {
                  const c = APPT_STATUS_COLORS[a.status];
                  const dateStr = new Date(a.requestedDate).toLocaleDateString(
                    "en-RW",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    },
                  );
                  return (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                        <CalendarClock size={15} className="text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {a.purpose}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {dateStr} · {a.requestedTime}
                        </p>
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            c.bg,
                            c.text,
                          )}
                        >
                          <span className={cn("h-1 w-1 rounded-full", c.dot)} />
                          {APPT_STATUS_LABELS[a.status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/client/notaries"
              className="group flex items-center justify-between rounded-2xl bg-[#103060] px-4 sm:px-5 py-4 hover:bg-[#0d2750] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Search size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Find a Notary</p>
                  <p className="text-xs text-white/50">
                    Send a request or book a visit
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-white/50 group-hover:translate-x-0.5 transition-transform shrink-0"
              />
            </Link>

            <Link
              href="/client/requests"
              className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 sm:px-5 py-4 hover:border-[#103060]/20 hover:bg-[#103060]/2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#103060]/5">
                  <ClipboardList size={16} className="text-[#103060]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">My Requests</p>
                  <p className="text-xs text-gray-400">
                    Track all your submissions
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-gray-300 group-hover:text-[#103060] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
