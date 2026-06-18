"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Search, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import { requestsApi, requestsKeys, STATUS_COLORS, STATUS_LABELS, type RequestStatus } from "@/lib/requests-api";
import { cn } from "@/lib/cn";

function StatusBadge({ status }: { status: RequestStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function ClientDashboard() {
  const user = getUser();

  const { data: requests, isLoading } = useQuery({
    queryKey: requestsKeys.lists(),
    queryFn:  requestsApi.list,
  });

  const total     = requests?.length ?? 0;
  const pending   = requests?.filter((r) => r.status === "pending").length   ?? 0;
  const accepted  = requests?.filter((r) => r.status === "accepted").length  ?? 0;
  const completed = requests?.filter((r) => r.status === "completed").length ?? 0;

  const recent = requests?.slice(0, 5) ?? [];

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage your notarization requests
          </p>
        </div>
        <Link
          href="/client/notaries"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#103060] text-white text-sm font-medium hover:bg-[#0d2750] transition-colors shadow-sm"
        >
          <Search size={15} /> Find a Notary
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: total,     icon: ClipboardList, cls: "bg-[#103060]/10 text-[#103060]" },
          { label: "Pending",        value: pending,   icon: Clock,         cls: "bg-amber-50 text-amber-600"     },
          { label: "Accepted",       value: accepted,  icon: CheckCircle2,  cls: "bg-blue-50 text-blue-600"       },
          { label: "Completed",      value: completed, icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-600" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", cls)}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {isLoading ? <span className="inline-block h-6 w-8 rounded bg-gray-100 animate-pulse" /> : value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Requests</h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
          </div>
          <Link href="/client/requests" className="text-xs font-medium text-[#103060] hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                  <div className="h-2.5 w-48 bg-gray-100 rounded" />
                </div>
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : !recent.length ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
              <ClipboardList size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-700">No requests yet</p>
            <p className="text-xs text-gray-400 mt-1">Find a notary and submit your first request</p>
            <Link href="/client/notaries" className="mt-3 text-xs font-medium text-[#103060] hover:underline">
              Browse notaries →
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#103060]/5 text-[#103060]">
                  <ClipboardList size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{req.documentType}</p>
                  <p className="text-xs text-gray-400 truncate">
                    Notary: {req.notary?.firstName} {req.notary?.lastName}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/client/notaries"
          className="group flex items-center justify-between rounded-2xl bg-[#103060] p-5 hover:bg-[#0d2750] transition-colors"
        >
          <div>
            <p className="text-base font-semibold text-white">Find a Notary</p>
            <p className="text-xs text-white/50 mt-0.5">Browse available notaries and submit a request</p>
          </div>
          <ArrowRight size={18} className="text-white/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
        <Link
          href="/client/requests"
          className="group flex items-center justify-between rounded-2xl bg-white border border-gray-100 p-5 hover:border-[#103060]/20 hover:bg-[#103060]/[0.02] transition-colors"
        >
          <div>
            <p className="text-base font-semibold text-gray-900">My Requests</p>
            <p className="text-xs text-gray-400 mt-0.5">View status and updates on all your requests</p>
          </div>
          <ArrowRight size={18} className="text-gray-300 group-hover:text-[#103060] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </div>
    </div>
  );
}
