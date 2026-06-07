"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FolderPlus,
  FolderOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  dossiersApi,
  dossiersKeys,
  type Dossier,
  type DossierStatus,
} from "@/lib/dossiers-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from "@/components/ui/Table";
import { cn } from "@/lib/cn";

const LIMIT = 20;

const STATUS_TABS: { label: string; value: DossierStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

const STATUS_BADGE: Record<
  DossierStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700" },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700",
  },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-600" },
};

function StatusBadge({ status }: { status: DossierStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
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

function getIsAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return user?.role === "administrator";
  } catch {
    return false;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DossiersPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeStatus, setActiveStatus] = useState<DossierStatus | "all">(
    "all",
  );

  const [deleteTarget, setDeleteTarget] = useState<Dossier | null>(null);
  const isAdmin = typeof window !== "undefined" ? getIsAdmin() : false;

  const queryParams = {
    q: debouncedSearch || undefined,
    status: activeStatus === "all" ? undefined : activeStatus,
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: dossiersKeys.list(queryParams),
    queryFn: () => dossiersApi.list(queryParams),
  });

  const dossiers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const deleteMut = useMutation({
    mutationFn: (id: string) => dossiersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dossiersKeys.lists() });
      success("Dossier deleted.");
      setDeleteTarget(null);
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to delete dossier.",
      ),
  });

  function onSearch(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Dossiers" />

        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Dossiers
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isLoading
                  ? "Loading…"
                  : `${total} ${total === 1 ? "dossier" : "dossiers"} total`}
              </p>
            </div>
            <Link href="/dashboard/dossiers/new">
              <Button size="sm" leftIcon={<FolderPlus size={14} />}>
                New Dossier
              </Button>
            </Link>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setActiveStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeStatus === tab.value
                    ? "bg-brand-500 text-white"
                    : "bg-surface text-muted hover:text-foreground hover:bg-gray-100",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-5 max-w-sm">
            <Input
              placeholder="Search by number or client name…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              leftElement={<Search size={15} />}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>#Number</TableTh>
                <TableTh>Client</TableTh>
                <TableTh className="hidden md:table-cell">Service</TableTh>
                <TableTh className="hidden lg:table-cell">
                  Assigned Notary
                </TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="hidden sm:table-cell">Created</TableTh>
                <TableTh>Actions</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableTd colSpan={7} className="p-0">
                    <TableSkeleton rows={8} cols={7} />
                  </TableTd>
                </TableRow>
              ) : dossiers.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={7} className="p-0">
                    <EmptyState
                      icon={FolderOpen}
                      title={
                        debouncedSearch || activeStatus !== "all"
                          ? "No dossiers match your filters"
                          : "No dossiers yet"
                      }
                      description={
                        debouncedSearch || activeStatus !== "all"
                          ? "Try a different search or filter."
                          : "Create the first dossier to get started."
                      }
                      action={
                        !debouncedSearch && activeStatus === "all" ? (
                          <Link href="/dashboard/dossiers/new">
                            <Button
                              size="sm"
                              leftIcon={<FolderPlus size={14} />}
                            >
                              New Dossier
                            </Button>
                          </Link>
                        ) : undefined
                      }
                    />
                  </TableTd>
                </TableRow>
              ) : (
                dossiers.map((d) => (
                  <TableRow key={d.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {d.number}
                    </TableTd>

                    <TableTd>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                          {d.client.photoUrl ? (
                            <Image
                              src={d.client.photoUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-brand-600">
                              {d.client.firstName[0]}
                              {d.client.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {d.client.firstName} {d.client.lastName}
                          </p>
                          <p className="text-xs text-muted font-mono truncate">
                            {d.client.nationalId}
                          </p>
                        </div>
                      </div>
                    </TableTd>

                    <TableTd className="hidden md:table-cell text-xs text-muted">
                      {d.serviceName ?? d.serviceType ?? "—"}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-xs text-muted">
                      {d.assignedNotary
                        ? `${d.assignedNotary.firstName} ${d.assignedNotary.lastName}`
                        : (d.statusHistory?.[0]?.changedByName ?? "—")}
                    </TableTd>

                    <TableTd>
                      <StatusBadge status={d.status} />
                    </TableTd>

                    <TableTd className="hidden sm:table-cell text-xs text-muted">
                      {formatDate(d.createdAt)}
                    </TableTd>

                    <TableTd>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/dossiers/${d.id}`}
                          title="View dossier"
                          className="p-1.5 rounded cursor-pointer text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        {isAdmin && (
                          <button
                            type="button"
                            title="Delete dossier"
                            onClick={() => setDeleteTarget(d)}
                            className="p-1.5 rounded cursor-pointer text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </TableTd>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border transition-colors",
                    page <= 1
                      ? "opacity-40 cursor-not-allowed bg-white text-muted"
                      : "bg-white text-foreground hover:bg-surface cursor-pointer",
                  )}
                >
                  <ChevronLeft size={13} />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border transition-colors",
                    page >= totalPages
                      ? "opacity-40 cursor-not-allowed bg-white text-muted"
                      : "bg-white text-foreground hover:bg-surface cursor-pointer",
                  )}
                >
                  Next
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => !deleteMut.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete this dossier?"
        description={
          deleteTarget && (
            <>
              Dossier{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.number}
              </span>{" "}
              will be permanently removed. This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete dossier"
        tone="danger"
        loading={deleteMut.isPending}
      />
    </>
  );
}
