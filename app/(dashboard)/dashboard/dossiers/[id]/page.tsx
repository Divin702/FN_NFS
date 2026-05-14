"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  FileText,
  Download,
  X,
  Plus,
  Save,
  FolderOpen,
  Loader2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import {
  dossiersApi,
  dossiersKeys,
  type DossierStatus,
  type DossierDocument,
} from "@/lib/dossiers-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

const STATUS_BADGE: Record<
  DossierStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700" },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700",
  },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-600" },
};

const STATUS_PROGRESSION: Record<DossierStatus, DossierStatus[]> = {
  open: ["in_progress"],
  in_progress: ["completed"],
  completed: ["archived"],
  archived: [],
};

function StatusBadge({ status }: { status: DossierStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function uploadFileToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
  );
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("File upload failed.");
  return data.secure_url as string;
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-3 animate-pulse">
      <div className="h-4 w-1/3 bg-surface rounded" />
      <div className="h-3 w-full bg-surface rounded" />
      <div className="h-3 w-5/6 bg-surface rounded" />
      <div className="h-3 w-4/6 bg-surface rounded" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DossierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data: dossier, isLoading, isError } = useQuery({
    queryKey: dossiersKeys.detail(id),
    queryFn: () => dossiersApi.get(id),
    enabled: !!id,
  });

  // Notes state
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (dossier) setNotes(dossier.notes ?? "");
  }, [dossier]);

  // Status change
  const [selectedNextStatus, setSelectedNextStatus] =
    useState<DossierStatus | "">("");

  // Add document
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState("");

  const saveNotesMut = useMutation({
    mutationFn: () => dossiersApi.update(id, { notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dossiersKeys.detail(id) });
      success("Notes saved.");
    },
    onError: (err) =>
      toastError(err instanceof ApiError ? err.message : "Failed to save notes."),
  });

  const changeStatusMut = useMutation({
    mutationFn: (status: DossierStatus) =>
      dossiersApi.changeStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dossiersKeys.detail(id) });
      qc.invalidateQueries({ queryKey: dossiersKeys.lists() });
      success("Status updated.");
      setSelectedNextStatus("");
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to update status."
      ),
  });

  const addDocMut = useMutation({
    mutationFn: (doc: { name: string; url: string }) =>
      dossiersApi.addDocument(id, doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dossiersKeys.detail(id) });
      success("Document added.");
      setShowAddDoc(false);
      setDocName("");
      setDocFile(null);
      setDocError("");
    },
    onError: (err) =>
      setDocError(
        err instanceof ApiError ? err.message : "Failed to add document."
      ),
  });

  const removeDocMut = useMutation({
    mutationFn: (url: string) => dossiersApi.removeDocument(id, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dossiersKeys.detail(id) });
      success("Document removed.");
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to remove document."
      ),
  });

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docName.trim()) {
      setDocError("Document name is required.");
      return;
    }
    if (!docFile) {
      setDocError("Please select a file.");
      return;
    }
    setDocError("");
    setDocUploading(true);
    let url: string;
    try {
      url = await uploadFileToCloudinary(docFile);
    } catch {
      setDocError("File upload failed. Please try again.");
      setDocUploading(false);
      return;
    }
    setDocUploading(false);
    addDocMut.mutate({ name: docName.trim(), url });
  }

  const nextStatuses = dossier
    ? STATUS_PROGRESSION[dossier.status]
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Dossier" />
        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          <div className="mb-5">
            <div className="h-4 w-24 bg-surface rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="space-y-5">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !dossier) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Dossier" />
        <main className="flex-1 p-5 sm:p-6 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-surface text-muted mb-4">
              <FolderOpen size={28} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Dossier not found
            </p>
            <p className="text-sm text-muted mt-1 mb-4">
              This dossier may have been deleted or does not exist.
            </p>
            <Link href="/dashboard/dossiers">
              <Button size="sm" variant="outline" leftIcon={<ChevronLeft size={14} />}>
                Back to Dossiers
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Dossier Detail" />

      <main className="flex-1 p-5 sm:p-6 overflow-auto">
        {/* Top bar */}
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/dashboard/dossiers"
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={15} />
              Dossiers
            </Link>
            <span className="text-muted">/</span>
            <h2 className="text-lg font-semibold text-foreground font-mono">
              {dossier.number}
            </h2>
            <StatusBadge status={dossier.status} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Info card */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Dossier Information
              </h3>
              <dl className="space-y-3">
                {/* Client */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                  <dt className="text-xs text-muted sm:w-36 shrink-0">
                    Client
                  </dt>
                  <dd>
                    <Link
                      href={`/dashboard/clients`}
                      className="flex items-center gap-2.5 group w-fit"
                    >
                      <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                        {dossier.client.photoUrl ? (
                          <img
                            src={dossier.client.photoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-brand-600">
                            {dossier.client.firstName[0]}
                            {dossier.client.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-brand-600 transition-colors">
                          {dossier.client.firstName} {dossier.client.lastName}
                        </p>
                        <p className="text-xs text-muted font-mono">
                          {dossier.client.nationalId}
                        </p>
                      </div>
                    </Link>
                  </dd>
                </div>

                {/* Assigned Notary */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                  <dt className="text-xs text-muted sm:w-36 shrink-0">
                    Assigned Notary
                  </dt>
                  <dd className="text-sm text-foreground">
                    {dossier.assignedNotary
                      ? `${dossier.assignedNotary.firstName} ${dossier.assignedNotary.lastName}`
                      : "—"}
                  </dd>
                </div>

                {/* Service Type */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                  <dt className="text-xs text-muted sm:w-36 shrink-0">
                    Service Type
                  </dt>
                  <dd className="text-sm text-foreground">
                    {dossier.serviceType ?? "—"}
                  </dd>
                </div>

                {/* Description */}
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
                  <dt className="text-xs text-muted sm:w-36 shrink-0">
                    Description
                  </dt>
                  <dd className="text-sm text-foreground leading-relaxed">
                    {dossier.description ?? "—"}
                  </dd>
                </div>

                {/* Dates */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                  <dt className="text-xs text-muted sm:w-36 shrink-0">
                    Created
                  </dt>
                  <dd className="text-sm text-foreground">
                    {formatDateTime(dossier.createdAt)}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                  <dt className="text-xs text-muted sm:w-36 shrink-0">
                    Last Updated
                  </dt>
                  <dd className="text-sm text-foreground">
                    {formatDateTime(dossier.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Documents section */}
            <div className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Documents ({dossier.documents.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={13} />}
                  onClick={() => setShowAddDoc((v) => !v)}
                >
                  Add Document
                </Button>
              </div>

              {/* Add document form */}
              {showAddDoc && (
                <form
                  onSubmit={handleAddDocument}
                  className="mb-4 p-4 rounded-lg bg-surface border border-border space-y-3"
                >
                  <Input
                    label="Document Name"
                    placeholder="e.g. Identity Copy, Deed, Contract…"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">
                      File <span className="text-red-500">*</span>
                    </label>
                    <label
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-white cursor-pointer",
                        "hover:border-brand-400 hover:bg-brand-50 transition-colors text-sm text-muted"
                      )}
                    >
                      <Upload size={14} />
                      {docFile ? docFile.name : "Click to select a file…"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setDocFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>

                  {docError && (
                    <p className="text-xs text-red-500">{docError}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddDoc(false);
                        setDocName("");
                        setDocFile(null);
                        setDocError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      loading={docUploading || addDocMut.isPending}
                    >
                      Upload
                    </Button>
                  </div>
                </form>
              )}

              {dossier.documents.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dossier.documents.map((doc: DossierDocument) => (
                    <li
                      key={doc.url}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-surface"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-border text-muted">
                          <FileText size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download"
                          className="p-1.5 rounded text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          type="button"
                          title="Remove document"
                          onClick={() => removeDocMut.mutate(doc.url)}
                          disabled={removeDocMut.isPending}
                          className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notes section */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add internal notes about this dossier…"
                className={cn(
                  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
                  "placeholder:text-muted resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                  "transition-shadow duration-150"
                )}
              />
              <div className="mt-3">
                <Button
                  size="sm"
                  leftIcon={<Save size={13} />}
                  loading={saveNotesMut.isPending}
                  onClick={() => saveNotesMut.mutate()}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            {/* Status card */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Status
              </h3>

              {/* Current status */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted">Current:</span>
                <StatusBadge status={dossier.status} />
              </div>

              {nextStatuses.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium">
                    Change to:
                  </label>
                  <select
                    value={selectedNextStatus}
                    onChange={(e) =>
                      setSelectedNextStatus(e.target.value as DossierStatus)
                    }
                    className={cn(
                      "w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                      "transition-shadow duration-150"
                    )}
                  >
                    <option value="">Select status…</option>
                    {nextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_BADGE[s].label}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!selectedNextStatus}
                    loading={changeStatusMut.isPending}
                    onClick={() =>
                      selectedNextStatus &&
                      changeStatusMut.mutate(selectedNextStatus as DossierStatus)
                    }
                  >
                    Update Status
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  No further status transitions available.
                </p>
              )}
            </div>

            {/* Status timeline */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Status History
              </h3>
              {dossier.statusHistory.length === 0 ? (
                <p className="text-xs text-muted">No history yet.</p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {[...dossier.statusHistory]
                    .reverse()
                    .map((entry, idx) => (
                      <li key={idx} className="ml-4">
                        <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-border bg-white" />
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge
                            status={entry.status as DossierStatus}
                          />
                          <p className="text-xs text-muted mt-1">
                            {entry.changedByName}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDateTime(entry.changedAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
