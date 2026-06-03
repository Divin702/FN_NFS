"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Pencil, Plus, Trash2, X, Search } from "lucide-react";
import {
  notaryServicesApi,
  notaryServicesKeys,
  type NotaryService,
  type CreateNotaryServiceBody,
  type UpdateNotaryServiceBody,
} from "@/lib/notary-services-api";
import { templatesApi, templatesKeys } from "@/lib/templates-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from "@/components/ui/Table";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

const LIMIT = 20;

function formatFee(n: number) {
  return n.toLocaleString("en-RW") + " RWF";
}

// ─── Service Panel ─────────────────────────────────────────────────────────────

interface ServicePanelProps {
  service: NotaryService | null;
  onClose: () => void;
  onSaved: () => void;
}

function ServicePanel({ service, onClose, onSaved }: ServicePanelProps) {
  const { success } = useToast();
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    officialFee:
      service?.officialFee != null ? String(service.officialFee) : "",
    linkedTemplateId: service?.linkedTemplateId ?? "",
    isActive: service?.isActive ?? true,
  });
  const [formError, setFormError] = useState("");

  const { data: templatesData } = useQuery({
    queryKey: templatesKeys.list({ status: "published", limit: 100 }),
    queryFn: () => templatesApi.getAll({ status: "published", limit: 100 }),
  });
  const templates = templatesData?.data ?? [];

  const createMut = useMutation({
    mutationFn: (body: CreateNotaryServiceBody) =>
      notaryServicesApi.create(body),
    onSuccess: () => {
      success("Service created.");
      onSaved();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save service.",
      ),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateNotaryServiceBody }) =>
      notaryServicesApi.update(id, body),
    onSuccess: () => {
      success("Service updated.");
      onSaved();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save service.",
      ),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const fee = Number(form.officialFee);
    if (isNaN(fee) || fee < 0) {
      setFormError("Official fee must be a valid number.");
      return;
    }
    setFormError("");

    const body: CreateNotaryServiceBody = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      officialFee: fee,
      linkedTemplateId: form.linkedTemplateId || null,
      isActive: form.isActive,
    };

    if (service) {
      updateMut.mutate({ id: service.id, body });
    } else {
      createMut.mutate(body);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => !isPending && onClose()}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Briefcase size={16} />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {service ? "Edit Service" : "New Service"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
        >
          <Input
            label="Name"
            placeholder="e.g. Property Transfer"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              placeholder="Brief description of this service…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={cn(
                "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground",
                "placeholder:text-muted resize-none",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                "transition-shadow duration-150",
              )}
            />
          </div>

          <Input
            label="Official Fee (RWF)"
            type="number"
            min={0}
            placeholder="0"
            required
            value={form.officialFee}
            onChange={(e) => set("officialFee", e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Linked Template
            </label>
            <select
              value={form.linkedTemplateId}
              onChange={(e) => set("linkedTemplateId", e.target.value)}
              className={cn(
                "w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                "transition-shadow duration-150 cursor-pointer",
              )}
            >
              <option value="">— No template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Active
            </label>
          </div>

          {formError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              {formError}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            loading={isPending}
            onClick={handleSubmit}
          >
            {service ? "Save Changes" : "Create Service"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [panelService, setPanelService] = useState<
    NotaryService | null | "new"
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<NotaryService | null>(null);

  const isAdmin = getUser()?.role === "administrator";

  useEffect(() => {
    const user = getUser();
    if (
      user &&
      user.role !== "administrator" &&
      user.role !== "notary_public"
    ) {
      router.replace("/dashboard");
    }
  }, [router]);

  const queryParams = { q: debouncedSearch || undefined, page, limit: LIMIT };

  const { data, isLoading } = useQuery({
    queryKey: notaryServicesKeys.list(queryParams),
    queryFn: () => notaryServicesApi.list(queryParams),
  });

  const { data: allTemplatesData } = useQuery({
    queryKey: ["templates-all"],
    queryFn: () => templatesApi.getAll({ limit: 100 }),
  });
  const templateNameById = Object.fromEntries(
    (allTemplatesData?.data ?? []).map((t) => [t.id, t.name]),
  );

  const services = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const deleteMut = useMutation({
    mutationFn: (id: string) => notaryServicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notaryServicesKeys.lists() });
      success("Service deleted.");
      setDeleteTarget(null);
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to delete service.",
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

  function afterSaved() {
    qc.invalidateQueries({ queryKey: notaryServicesKeys.lists() });
    setPanelService(null);
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Services" />

        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Notary Services
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isLoading
                  ? "Loading…"
                  : `${total} ${total === 1 ? "service" : "services"}`}
              </p>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setPanelService("new")}
              >
                New Service
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="mb-5 max-w-sm">
            <Input
              placeholder="Search services…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              leftElement={<Search size={15} />}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Name</TableTh>
                <TableTh className="hidden md:table-cell">Description</TableTh>
                <TableTh>Official Fee</TableTh>
                <TableTh className="hidden lg:table-cell">
                  Linked Template
                </TableTh>
                <TableTh>Status</TableTh>
                <TableTh>Actions</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableTd colSpan={6} className="p-0">
                    <TableSkeleton rows={8} cols={6} />
                  </TableTd>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={6} className="p-0">
                    <EmptyState
                      icon={Briefcase}
                      title={
                        debouncedSearch
                          ? "No services match your search"
                          : "No services yet"
                      }
                      description={
                        debouncedSearch
                          ? "Try a different search term."
                          : "Create the first notary service to get started."
                      }
                      action={
                        isAdmin && !debouncedSearch ? (
                          <Button
                            size="sm"
                            leftIcon={<Plus size={14} />}
                            onClick={() => setPanelService("new")}
                          >
                            New Service
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableTd>
                </TableRow>
              ) : (
                services.map((s) => (
                  <TableRow key={s.id}>
                    <TableTd>
                      <p className="text-sm font-medium text-foreground">
                        {s.name}
                      </p>
                    </TableTd>

                    <TableTd className="hidden md:table-cell text-xs text-muted max-w-xs truncate">
                      {s.description ?? "—"}
                    </TableTd>

                    <TableTd className="text-sm text-foreground whitespace-nowrap">
                      {formatFee(s.officialFee)}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-xs text-muted">
                      {s.linkedTemplateId
                        ? (templateNameById[s.linkedTemplateId] ??
                          s.linkedTemplateId)
                        : "—"}
                    </TableTd>

                    <TableTd>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          s.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableTd>

                    <TableTd>
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Edit service"
                            onClick={() => setPanelService(s)}
                            className="p-1.5 rounded cursor-pointer text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete service"
                            onClick={() => setDeleteTarget(s)}
                            className="p-1.5 rounded cursor-pointer text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
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
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit panel */}
      {panelService !== null && (
        <ServicePanel
          service={panelService === "new" ? null : panelService}
          onClose={() => setPanelService(null)}
          onSaved={afterSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => !deleteMut.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete this service?"
        description={
          deleteTarget && (
            <>
              <span className="font-medium text-foreground">
                {deleteTarget.name}
              </span>{" "}
              will be permanently removed. This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete service"
        tone="danger"
        loading={deleteMut.isPending}
      />
    </>
  );
}
