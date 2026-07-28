"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Upload, ChevronDown, FileText, Search, Eye } from "lucide-react";
import type { TemplateField } from "@/lib/templates-api";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "@/components/ui/Table";
import { templatesApi, templatesKeys, type DocumentTemplate, type TemplateStatus, type CreateTemplateDto } from "@/lib/templates-api";
import { categoriesApi, categoriesKeys } from "@/lib/categories-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { CldUploadWidget } from "next-cloudinary";
import dynamic from "next/dynamic";
import { Topbar } from "@/components/dashboard/Topbar";

const RichEditor = dynamic(() => import("@/components/ui/RichEditor"), { ssr: false });

function Modal({ title, onClose, wide = false, children }: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className={`bg-white rounded-lg shadow-xl w-full my-8 ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white rounded-t-lg z-10">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const emptyForm: CreateTemplateDto & { content: string } = {
  name: "", templateCode: "", shortDescription: "",
  content: "", fileUrl: "", status: "draft", categoryId: "",
};

// Turn a human label into a camelCase field key, e.g. "Client Full Name" → "clientFullName".
function slugKey(label: string): string {
  const words = label.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
}

// Friendly file name from a Cloudinary/URL path.
function fileNameFromUrl(url: string): string {
  try {
    const last = new URL(url).pathname.split("/").pop() ?? "";
    return decodeURIComponent(last) || "Attached document";
  } catch {
    return "Attached document";
  }
}

// Fields that auto-populate from client/notary data when a dossier is created.
// The `key` is what the dossier flow looks for — admins never see or type it.
const AUTOFILL_PRESETS: { key: string; label: string }[] = [
  { key: "clientName", label: "Client Name" },
  { key: "nationalId", label: "National ID" },
  { key: "date", label: "Date" },
  { key: "phone", label: "Phone" },
  { key: "notaryName", label: "Notary Name" },
];
const RESERVED_KEYS = new Set(AUTOFILL_PRESETS.map((p) => p.key));

export default function TemplatesPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const isAdmin = getUser()?.role === "administrator";

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | TemplateStatus>("");
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modal, setModal] = useState<"create" | "edit" | "view" | "delete" | null>(null);
  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 350);
  }

  const queryParams = {
    search: debouncedSearch || undefined,
    categoryId: filterCategory || undefined,
    status: (filterStatus as TemplateStatus) || undefined,
    page,
    limit: 20,
  };

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: templatesKeys.list(queryParams),
    queryFn: () => templatesApi.getAll(queryParams),
  });

  const { data: categories = [] } = useQuery({
    queryKey: categoriesKeys.lists(),
    queryFn: categoriesApi.getAll,
  });

  const templates = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templatesKeys.lists() });
      success("Template created");
      closeModal();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "An error occurred"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateDto> }) =>
      templatesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templatesKeys.lists() });
      success("Template updated — version bumped");
      closeModal();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "An error occurred"),
  });

  const deleteMut = useMutation({
    mutationFn: templatesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templatesKeys.lists() });
      success("Template deleted");
      closeModal();
    },
    onError: (err) => toastError(err instanceof ApiError ? err.message : "Failed to delete"),
  });

  const saving = createMut.isPending || updateMut.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openCreate() {
    setForm({ ...emptyForm });
    setFields([]);
    setFormError("");
    setModal("create");
  }

  function openEdit(tpl: DocumentTemplate) {
    setSelected(tpl);
    setForm({
      name: tpl.name,
      templateCode: tpl.templateCode,
      shortDescription: tpl.shortDescription ?? "",
      content: tpl.content ?? "",
      fileUrl: tpl.fileUrl ?? "",
      status: tpl.status,
      categoryId: tpl.categoryId ?? "",
    });
    setFields(tpl.fields ?? []);
    setFormError("");
    setModal("edit");
  }

  function openView(tpl: DocumentTemplate) {
    setSelected(tpl);
    setFields(tpl.fields ?? []);
    setModal("view");
  }

  function openDelete(tpl: DocumentTemplate) {
    setSelected(tpl);
    setModal("delete");
  }

  function closeModal() { setModal(null); setSelected(null); setFormError(""); setFields([]); }

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.templateCode.trim()) { setFormError("Template code is required"); return; }
    setFormError("");

    const payload: CreateTemplateDto = {
      name: form.name.trim(),
      templateCode: form.templateCode.trim(),
      shortDescription: form.shortDescription?.trim() || undefined,
      content: form.content?.trim() || undefined,
      fileUrl: form.fileUrl?.trim() || undefined,
      status: form.status,
      categoryId: form.categoryId || undefined,
      fields: fields.filter((f) => f.key.trim() && f.label.trim()),
    };

    if (modal === "create") {
      createMut.mutate(payload);
    } else if (modal === "edit" && selected) {
      updateMut.mutate({ id: selected.id, data: payload });
    }
  }

  const nextVersion = selected?.version
    .split(".").map((v, i) => i === 2 ? String(+v + 1) : v).join(".");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Document Templates" />
      <main className="flex-1 p-5 sm:p-6 overflow-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Templates</h2>
          <p className="text-xs text-muted mt-0.5">
            {isLoading ? "Loading…" : `${meta.total} template${meta.total !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} size="sm" leftIcon={<Plus size={14} />}>
            New Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftElement={<Search size={15} />}
          />
        </div>
        <div className="relative">
          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as "" | TemplateStatus); setPage(1); }}
            className="h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableTh>Name</TableTh>
            <TableTh>Code</TableTh>
            <TableTh>Version</TableTh>
            <TableTh>Category</TableTh>
            <TableTh>Status</TableTh>
            <TableTh className="w-24">Actions</TableTh>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableTd colSpan={6} className="p-0">
                <TableSkeleton rows={6} cols={6} />
              </TableTd>
            </TableRow>
          ) : templates.length === 0 ? (
            <TableRow>
              <TableTd colSpan={6} className="p-0">
                <EmptyState
                  icon={FileText}
                  title={filterCategory || filterStatus || debouncedSearch ? "No templates match your filters" : "No templates yet"}
                  description={
                    filterCategory || filterStatus || debouncedSearch
                      ? "Try clearing your filters or search term."
                      : "Create your first document template to get started."
                  }
                  action={
                    isAdmin && !filterCategory && !filterStatus && !debouncedSearch ? (
                      <Button size="sm" onClick={openCreate}>
                        <Plus size={14} className="mr-1.5" /> New Template
                      </Button>
                    ) : undefined
                  }
                />
              </TableTd>
            </TableRow>
          ) : templates.map((tpl) => (
            <TableRow key={tpl.id}>
              <TableTd>
                <div className="font-medium text-foreground">{tpl.name}</div>
                {tpl.shortDescription && (
                  <div className="text-xs text-muted mt-0.5 line-clamp-1">{tpl.shortDescription}</div>
                )}
              </TableTd>
              <TableTd>
                <code className="text-xs bg-surface px-1.5 py-0.5 rounded text-muted">{tpl.templateCode}</code>
              </TableTd>
              <TableTd className="text-muted text-xs">{tpl.version}</TableTd>
              <TableTd className="text-sm text-muted">{tpl.category?.name ?? "—"}</TableTd>
              <TableTd>
                <Badge variant={tpl.status === "published" ? "success" : "default"}>
                  {tpl.status === "published" ? "Published" : "Draft"}
                </Badge>
              </TableTd>
              <TableTd>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => openView(tpl)} aria-label={`View ${tpl.name}`}
                    className="p-1.5 rounded cursor-pointer hover:bg-surface text-muted hover:text-brand-600 transition-colors">
                    <Eye size={15} />
                  </button>
                  {isAdmin && (
                    <>
                      <button type="button" onClick={() => openEdit(tpl)} aria-label={`Edit ${tpl.name}`}
                        className="p-1.5 rounded cursor-pointer hover:bg-surface text-muted hover:text-brand-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => openDelete(tpl)} aria-label={`Delete ${tpl.name}`}
                        className="p-1.5 rounded cursor-pointer hover:bg-red-50 text-muted hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </TableTd>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "New Template" : `Edit Template — v${selected?.version}`} onClose={closeModal} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Template Name" value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Property Sale Agreement" />
              <Input label="Template Code" value={form.templateCode}
                onChange={(e) => setField("templateCode", e.target.value.toUpperCase())}
                placeholder="TPL-RE-001" hint="Uppercase, numbers, - or _"
                disabled={modal === "edit"} />
            </div>

            <Input label="Short Description" value={form.shortDescription ?? ""}
              onChange={(e) => setField("shortDescription", e.target.value)}
              placeholder="One-line summary" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="relative">
                  <select aria-label="Category" value={form.categoryId ?? ""}
                    onChange={(e) => setField("categoryId", e.target.value)}
                    className="w-full h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— No category —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Status</label>
                <div className="relative">
                  <select aria-label="Status" value={form.status}
                    onChange={(e) => setField("status", e.target.value as TemplateStatus)}
                    className="w-full h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Content</label>
              <RichEditor value={form.content ?? ""} onChange={(val) => setField("content", val)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Document File <span className="text-muted font-normal">(optional .docx)</span>
              </label>
              {form.fileUrl ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface text-sm">
                  <FileText size={15} className="shrink-0 text-brand-600" />
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 truncate text-foreground hover:text-brand-600 hover:underline">
                    {fileNameFromUrl(form.fileUrl)}
                  </a>
                  <button type="button" onClick={() => setField("fileUrl", "")} aria-label="Remove file"
                    className="shrink-0 text-muted hover:text-red-600 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""}
                  options={{ resourceType: "raw", maxFiles: 1 }}
                  onSuccess={(result) => {
                    if (result.info && typeof result.info === "object" && "secure_url" in result.info) {
                      setField("fileUrl", result.info.secure_url as string);
                    }
                  }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-surface text-sm text-muted hover:border-brand-400 hover:text-brand-600 transition-colors">
                      <Upload size={14} /> Upload .docx via Cloudinary
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>

            {/* ── Fillable Fields ── */}
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Fillable Fields</p>
                <p className="text-xs text-muted mt-0.5">
                  What the notary fills in for each client when creating a dossier.
                </p>
              </div>

              {/* Quick add — presets that auto-fill from client/notary data */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted mr-0.5">Quick add:</span>
                {AUTOFILL_PRESETS.map((preset) => {
                  const added = fields.some((f) => f.key === preset.key);
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      disabled={added}
                      onClick={() =>
                        setFields((f) => [...f, { key: preset.key, label: preset.label, required: true }])
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={11} /> {preset.label}
                    </button>
                  );
                })}
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted border border-dashed border-border rounded-lg px-3 py-3 text-center">
                  No fields yet — add a quick field above or a custom one below.
                </p>
              )}

              {fields.map((field, i) => {
                const isAuto = RESERVED_KEYS.has(field.key);
                return (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-surface">
                    <span className="text-xs text-muted shrink-0 w-5 text-center">{i + 1}.</span>
                    <input
                      placeholder="Field label (e.g. Property Address)"
                      value={field.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setFields((prev) =>
                          prev.map((f, idx) =>
                            idx === i
                              ? { ...f, label, key: RESERVED_KEYS.has(f.key) ? f.key : slugKey(label) }
                              : f,
                          ),
                        );
                      }}
                      className="flex-1 h-8 rounded-md border border-border bg-white px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 min-w-0"
                    />
                    {isAuto && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        Auto-filled
                      </span>
                    )}
                    <label className="flex items-center gap-1 text-xs text-muted shrink-0 cursor-pointer">
                      <input type="checkbox" checked={field.required}
                        onChange={(e) => setFields((prev) => prev.map((f, idx) => idx === i ? { ...f, required: e.target.checked } : f))}
                        className="rounded border-border" />
                      Required
                    </label>
                    <button type="button" onClick={() => setFields((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 text-muted hover:text-red-600 transition-colors" aria-label="Remove field">
                      <X size={14} />
                    </button>
                  </div>
                );
              })}

              <Button size="sm" variant="outline" className="self-start" leftIcon={<Plus size={13} />}
                onClick={() => setFields((f) => [...f, { key: "", label: "", required: true }])}>
                Add custom field
              </Button>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            {modal === "edit" && (
              <p className="text-xs text-muted bg-amber-50 border border-amber-100 rounded px-3 py-2">
                Saving will bump the version: {selected?.version} → {nextVersion}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                {modal === "create" ? "Create Template" : "Save Changes"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal (read-only — for notaries) */}
      {modal === "view" && selected && (
        <Modal title={`${selected.name} — v${selected.version}`} onClose={closeModal} wide>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs bg-surface px-1.5 py-0.5 rounded text-muted">{selected.templateCode}</code>
              <Badge variant={selected.status === "published" ? "success" : "default"}>
                {selected.status === "published" ? "Published" : "Draft"}
              </Badge>
              {selected.category?.name && (
                <span className="text-xs text-muted">Category: {selected.category.name}</span>
              )}
            </div>

            {selected.shortDescription && (
              <p className="text-sm text-muted">{selected.shortDescription}</p>
            )}

            {selected.fileUrl && (
              <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface text-sm text-foreground hover:text-brand-600 hover:border-brand-300 transition-colors">
                <FileText size={15} className="text-brand-600" />
                {fileNameFromUrl(selected.fileUrl)}
              </a>
            )}

            {selected.content && (
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Content</p>
                <div
                  className="prose prose-sm max-w-none rounded-lg border border-border bg-white p-4 text-sm text-foreground max-h-72 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                Fields to fill in ({fields.length})
              </p>
              {fields.length === 0 ? (
                <p className="text-sm text-muted">This template has no fillable fields.</p>
              ) : (
                <ul className="space-y-1.5">
                  {fields.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-muted w-5 text-center text-xs">{i + 1}.</span>
                      <span className="text-foreground">{f.label}</span>
                      {f.required && <span className="text-[10px] font-semibold text-red-500">required</span>}
                      {RESERVED_KEYS.has(f.key) && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Auto-filled
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" size="sm" onClick={closeModal}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={modal === "delete" && !!selected}
        onClose={() => !deleteMut.isPending && closeModal()}
        onConfirm={() => selected && deleteMut.mutate(selected.id)}
        title="Delete this template?"
        description={
          selected && (
            <>
              <span className="font-medium text-foreground">{selected.name}</span> ({selected.templateCode}){" "}
              will be permanently deleted. This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMut.isPending}
      />
      </main>
    </div>
  );
}
