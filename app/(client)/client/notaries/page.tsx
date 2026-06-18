"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  Search, Building2, Phone, Mail, MapPin,
  Send, X, CheckCircle2, ChevronRight,
} from "lucide-react";
import { requestsApi, requestsKeys, type Notary } from "@/lib/requests-api";
import { cn } from "@/lib/cn";

// ── Submit Request Modal ──────────────────────────────────────────────────────

function RequestModal({
  notary,
  onClose,
}: {
  notary: Notary;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    documentType: "",
    description: "",
    attachmentUrl: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      requestsApi.create({
        notaryId: notary.id,
        documentType: form.documentType,
        description: form.description,
        ...(form.attachmentUrl ? { attachmentUrl: form.attachmentUrl } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKeys.lists() });
      setSuccess(true);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Submission failed"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    mutate();
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">Request submitted!</p>
          <p className="text-sm text-gray-400 mt-1">
            {notary.firstName} {notary.lastName} will review your request shortly.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-5 py-2 rounded-xl bg-[#103060] text-white text-sm font-medium hover:bg-[#0d2750] transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
        <div className="h-10 w-10 rounded-xl bg-[#103060]/10 flex items-center justify-center shrink-0">
          <span className="text-[#103060] text-sm font-bold">
            {notary.firstName[0]}{notary.lastName[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {notary.firstName} {notary.lastName}
          </p>
          {notary.organization && (
            <p className="text-xs text-gray-400">{notary.organization}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Document type</label>
        <input
          type="text"
          required
          autoFocus
          placeholder="e.g. Sale agreement, Power of attorney…"
          value={form.documentType}
          onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          required
          rows={4}
          placeholder="Describe what you need notarized and any relevant details…"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Attachment URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          placeholder="https://drive.google.com/…"
          value={form.attachmentUrl}
          onChange={(e) => setForm((p) => ({ ...p, attachmentUrl: e.target.value }))}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#103060] text-white text-sm font-semibold hover:bg-[#0d2750] disabled:opacity-60 transition-colors"
      >
        {isPending ? (
          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <><Send size={14} /> Submit Request</>
        )}
      </button>
    </form>
  );
}

// ── Notary Card ───────────────────────────────────────────────────────────────

function NotaryCard({
  notary,
  onSelect,
}: {
  notary: Notary;
  onSelect: (n: Notary) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-[#103060]/20 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-[#103060]/10 flex items-center justify-center shrink-0">
          {notary.picture ? (
            <Image src={notary.picture} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[#103060] font-bold text-sm">
              {notary.firstName[0]}{notary.lastName[0]}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {notary.firstName} {notary.lastName}
          </p>
          {notary.organization && (
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 size={11} />
              {notary.organization}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500">
        {notary.phoneNumber && (
          <p className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" />{notary.phoneNumber}</p>
        )}
        {notary.email && (
          <p className="flex items-center gap-1.5 truncate"><Mail size={11} className="text-gray-400" />{notary.email}</p>
        )}
        {notary.address && (
          <p className="flex items-center gap-1.5 truncate"><MapPin size={11} className="text-gray-400" />{notary.address}</p>
        )}
      </div>

      {notary.signature && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center h-16 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={notary.signature} alt="Signature" className="max-h-full object-contain" />
        </div>
      )}

      <button
        onClick={() => onSelect(notary)}
        className="group flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#103060] text-white text-sm font-medium hover:bg-[#0d2750] transition-colors mt-auto"
      >
        Send Request <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FindNotaryPage() {
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Notary | null>(null);

  const { data: notaries, isLoading } = useQuery({
    queryKey: requestsKeys.notaries(),
    queryFn:  requestsApi.listNotaries,
  });

  const filtered = (notaries ?? []).filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `${n.firstName} ${n.lastName}`.toLowerCase().includes(q) ||
      (n.organization ?? "").toLowerCase().includes(q) ||
      (n.address ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Find a Notary</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a notary public to handle your document
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, organization, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <Search size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">No notaries found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? "Try a different search term" : "No active notaries are registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <NotaryCard key={n.id} notary={n} onSelect={setSelected} />
          ))}
        </div>
      )}

      {/* Request modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">New Notarization Request</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <RequestModal notary={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
