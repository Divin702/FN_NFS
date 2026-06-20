"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  ClipboardList, Calendar, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Check, ExternalLink, FolderPlus,
} from "lucide-react";
import Link from "next/link";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
  requestsApi,
  requestsKeys,
  STATUS_COLORS,
  STATUS_LABELS,
  type NotarizationRequest,
  type RequestStatus,
} from "@/lib/requests-api";
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

function RequestRow({ req }: { req: NotarizationRequest }) {
  const [open, setOpen]   = useState(false);
  const [notes, setNotes] = useState(req.notaryNotes ?? "");
  const qc = useQueryClient();

  const { mutate: update, isPending } = useMutation({
    mutationFn: (data: { status?: RequestStatus; notaryNotes?: string; notaryDocumentUrl?: string }) =>
      requestsApi.update(req.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: requestsKeys.lists() }),
  });

  const date = new Date(req.createdAt).toLocaleDateString("en-RW", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          <ClipboardList size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{req.documentType}</p>
          <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
            <Calendar size={10} />
            {date}
            {req.client && (
              <> · <span className="font-medium">{req.client.firstName} {req.client.lastName}</span></>
            )}
          </p>
        </div>
        <StatusBadge status={req.status} />
        <span className="ml-2 text-muted shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border space-y-4">

          {/* ── Client identity card ── */}
          {req.client && (
            <div className="mt-4 rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border">
                <p className="text-xs font-semibold text-foreground">Client Identity</p>
                {(req.status === "accepted" || req.status === "completed") && (
                  <Link
                    href={`/dashboard/dossiers/new`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <FolderPlus size={12} /> Create Dossier
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  { label: "Full Name",    value: `${req.client.firstName} ${req.client.lastName}` },
                  { label: "National ID",  value: req.client.nationalId ?? "—" },
                  { label: "Phone",        value: req.client.phoneNumber ?? "—" },
                  { label: "Email",        value: req.client.email ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white px-4 py-3">
                    <p className="text-[10px] text-muted font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted mb-1">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{req.description}</p>
          </div>

          {/* Client's uploaded documents */}
          {req.attachmentUrls && req.attachmentUrls.length > 0 && (
            <div>
              <p className="text-xs text-muted font-medium mb-1.5">
                Client&apos;s Documents ({req.attachmentUrls.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {req.attachmentUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:border-brand-500/30 hover:text-brand-600 transition-colors"
                  >
                    <ExternalLink size={13} /> Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Notes to client</label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder="Add a note for the client…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none transition"
              />
              <button
                type="button"
                onClick={() => update({ notaryNotes: notes })}
                disabled={isPending || notes === req.notaryNotes}
                title="Save notes"
                className="h-10 w-10 self-start rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 transition-colors shrink-0"
              >
                <Check size={15} />
              </button>
            </div>
          </div>

          {/* Notary's signed document (upload for accepted/completed) */}
          {(req.status === "accepted" || req.status === "completed") && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted font-medium">
                Notarized document
                <span className="ml-1.5 text-white bg-brand-500 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                  Upload for client
                </span>
              </p>
              <DocumentUpload
                value={req.notaryDocumentUrl}
                onChange={(url) => update({ notaryDocumentUrl: url })}
                onRemove={() => update({ notaryDocumentUrl: "" })}
                folder="nfs/requests/notary"
                label="Upload notarized document"
              />
            </div>
          )}

          {/* Status actions */}
          {req.status === "pending" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ status: "accepted" })}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50 transition-colors border border-blue-100"
              >
                <CheckCircle2 size={13} /> Accept
              </button>
              <button
                type="button"
                onClick={() => update({ status: "declined" })}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-100"
              >
                <XCircle size={13} /> Decline
              </button>
            </div>
          )}

          {req.status === "accepted" && (
            <div className="space-y-2">
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-xs text-amber-700">
                <span className="font-semibold">Multiple parties?</span> Use{" "}
                <Link href="/dashboard/dossiers/new" className="underline font-semibold hover:text-amber-900">
                  Create Dossier
                </Link>{" "}
                above to add all parties (buyer, seller, witnesses…) with National ID and fingerprint verification.
              </div>
              <button
                type="button"
                onClick={() => update({ status: "completed" })}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors border border-emerald-100"
              >
                <CheckCircle2 size={13} /> Mark as Completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: RequestStatus | "all" }[] = [
  { label: "All",       value: "all"       },
  { label: "Pending",   value: "pending"   },
  { label: "Accepted",  value: "accepted"  },
  { label: "Completed", value: "completed" },
  { label: "Declined",  value: "declined"  },
];

export default function NotaryRequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");

  const { data: requests, isLoading } = useQuery({
    queryKey: requestsKeys.lists(),
    queryFn:  requestsApi.list,
  });

  const filtered =
    filter === "all" ? (requests ?? []) : (requests ?? []).filter((r) => r.status === filter);

  const pending = requests?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Notarization Requests" />

      <main className="flex-1 overflow-auto p-5 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-muted">
                {requests?.length ?? 0} total
                {pending > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {pending} pending
                  </span>
                )}
              </p>
            </div>
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
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-white border border-border text-muted hover:border-brand-500/30 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-18 rounded-2xl bg-white border border-border animate-pulse" />
              ))}
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center py-16 text-center bg-white rounded-2xl border border-border">
              <div className="h-14 w-14 rounded-xl bg-surface flex items-center justify-center mb-3">
                <ClipboardList size={24} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {filter === "all" ? "No requests yet" : `No ${filter} requests`}
              </p>
              <p className="text-xs text-muted mt-1">
                Clients will submit requests through the portal
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
      </main>
    </div>
  );
}
