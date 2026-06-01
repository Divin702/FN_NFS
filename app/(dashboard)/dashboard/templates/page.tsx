"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Upload, ChevronDown, FileText, Search } from "lucide-react";
import type { TemplateField } from "@/lib/templates-api";
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

export default function TemplatesPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | TemplateStatus>("");
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
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
        <Button onClick={openCreate} size="sm" leftIcon={<Plus size={14} />}>
          New Template
        </Button>
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
                    !filterCategory && !filterStatus && !debouncedSearch ? (
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
                  <button type="button" onClick={() => openEdit(tpl)} aria-label={`Edit ${tpl.name}`}
                    className="p-1.5 rounded cursor-pointer hover:bg-surface text-muted hover:text-brand-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => openDelete(tpl)} aria-label={`Delete ${tpl.name}`}
                    className="p-1.5 rounded cursor-pointer hover:bg-red-50 text-muted hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
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
                  <span className="flex-1 truncate text-muted">{form.fileUrl}</span>
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Fillable Fields</p>
                  <p className="text-xs text-muted mt-0.5">
                    Fields the notary fills in per client when creating a dossier.
                    Use these keys for auto-fill: <span className="font-mono text-brand-600">clientName</span>, <span className="font-mono text-brand-600">nationalId</span>, <span className="font-mono text-brand-600">date</span>, <span className="font-mono text-brand-600">phone</span>, <span className="font-mono text-brand-600">notaryName</span>
                  </p>
                </div>
                <Button size="sm" variant="outline" leftIcon={<Plus size={13} />}
                  onClick={() => setFields((f) => [...f, { key: "", label: "", required: true }])}>
                  Add Field
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted border border-dashed border-border rounded-lg px-3 py-3 text-center">
                  No fields yet — click Add Field to define what the notary fills in per client.
                </p>
              )}

              {fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-xs text-muted shrink-0 w-5 text-center">{i + 1}.</span>
                  <input
                    placeholder="key (e.g. clientName)"
                    value={field.key}
                    onChange={(e) => setFields((prev) => prev.map((f, idx) => idx === i ? { ...f, key: e.target.value } : f))}
                    className="flex-1 h-8 rounded-md border border-border bg-white px-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 min-w-0"
                  />
                  <input
                    placeholder="Label (e.g. Client Full Name)"
                    value={field.label}
                    onChange={(e) => setFields((prev) => prev.map((f, idx) => idx === i ? { ...f, label: e.target.value } : f))}
                    className="flex-1 h-8 rounded-md border border-border bg-white px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 min-w-0"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted shrink-0 cursor-pointer">
                    <input type="checkbox" checked={field.required}
                      onChange={(e) => setFields((prev) => prev.map((f, idx) => idx === i ? { ...f, required: e.target.checked } : f))}
                      className="rounded border-border" />
                    Required
                  </label>
                  <button type="button" onClick={() => setFields((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-muted hover:text-red-600 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
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
