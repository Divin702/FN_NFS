"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import {
  requestsApi,
  requestsKeys,
  STATUS_COLORS,
  STATUS_LABELS,
  type NotarizationRequest,
  type RequestStatus,
} from "@/lib/requests-api";
import { useRequestNotifications } from "@/lib/use-request-notifications";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/cn";

function StatusBadge({ status }: { status: RequestStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function RequestRow({ req }: { req: NotarizationRequest }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const qc = useQueryClient();

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: () => requestsApi.remove(req.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKeys.lists() });
      setConfirmOpen(false);
    },
  });

  const canDelete = req.status === "pending";
  const date = new Date(req.createdAt).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#103060]/5 text-[#103060]">
          <ClipboardList size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {req.documentType}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Calendar size={10} />
            {date} · {req.notary?.firstName} {req.notary?.lastName}
          </p>
        </div>
        <StatusBadge status={req.status} />
        <span className="ml-2 text-gray-400 shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Assigned Notary</p>
              <p className="text-sm font-medium text-gray-800">
                {req.notary?.firstName} {req.notary?.lastName}
              </p>
              {req.notary?.email && (
                <p className="text-xs text-gray-400">{req.notary.email}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
              <p className="text-sm font-medium text-gray-800">{date}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {req.description}
            </p>
          </div>

          {req.attachmentUrls && req.attachmentUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Your Documents</p>
              <div className="flex flex-col gap-1.5">
                {req.attachmentUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#103060]/30 hover:text-[#103060] transition-colors"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notary's signed document — shown when available */}
          {req.notaryDocumentUrl && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Notarized document ready
              </p>
              <a
                href={req.notaryDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download notarized document
              </a>
            </div>
          )}

          {req.notaryNotes && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">
                Note from notary
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">
                {req.notaryNotes}
              </p>
            </div>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={removing}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors mt-2"
            >
              <Trash2 size={13} />
              {removing ? "Cancelling…" : "Cancel request"}
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => remove()}
        title="Cancel this request?"
        description={
          <>
            Your request for{" "}
            <span className="font-semibold text-gray-700">
              {req.documentType}
            </span>{" "}
            will be permanently removed. This cannot be undone.
          </>
        }
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        tone="danger"
        loading={removing}
        icon={Trash2}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: RequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Completed", value: "completed" },
  { label: "Declined", value: "declined" },
];

export default function MyRequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const { markAllSeen } = useRequestNotifications();

  const { data: requests, isLoading } = useQuery({
    queryKey: requestsKeys.lists(),
    queryFn: requestsApi.list,
    refetchInterval: 15_000,
  });

  // Mark all requests as seen the moment this page is viewed
  useEffect(() => {
    if (requests) markAllSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  const filtered =
    filter === "all"
      ? (requests ?? [])
      : (requests ?? []).filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {requests?.length ?? 0} total requests
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === value
                ? "bg-[#103060] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#103060]/30 hover:text-[#103060]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-18 rounded-2xl bg-white border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-16 text-center bg-white rounded-2xl border border-gray-100">
          <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <ClipboardList size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {filter === "all" ? "No requests yet" : `No ${filter} requests`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "all"
              ? "Browse notaries and submit your first request"
              : "Change the filter to see other requests"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <RequestRow key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
