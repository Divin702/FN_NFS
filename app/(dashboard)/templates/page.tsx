"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "@/components/ui/Table";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type DocumentTemplate,
  type TemplateStatus,
  type CreateTemplateDto,
} from "@/lib/templates-api";
import { getCategories, type TemplateCategory } from "@/lib/categories-api";
import { CldUploadWidget } from "next-cloudinary";
import dynamic from "next/dynamic";

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

function StatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <Badge variant={status === "published" ? "success" : "default"}>
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  );
}

const emptyForm: CreateTemplateDto & { content: string } = {
  name: "",
  templateCode: "",
  shortDescription: "",
  content: "",
  fileUrl: "",
  status: "draft",
  categoryId: "",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | TemplateStatus>("");
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await getTemplates({
        search: search || undefined,
        categoryId: filterCategory || undefined,
        status: (filterStatus as TemplateStatus) || undefined,
        page: p,
        limit: 20,
      });
      setTemplates(res.data);
      setMeta(res.meta);
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus, page]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1); }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, filterCategory, filterStatus]);

  useEffect(() => { load(page); }, [page]);

  function openCreate() {
    setForm({ ...emptyForm });
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
    setFormError("");
    setModal("edit");
  }

  function openDelete(tpl: DocumentTemplate) {
    setSelected(tpl);
    setModal("delete");
  }

  function closeModal() { setModal(null); setSelected(null); }

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.templateCode.trim()) { setFormError("Template code is required"); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload: CreateTemplateDto = {
        name: form.name.trim(),
        templateCode: form.templateCode.trim(),
        shortDescription: form.shortDescription?.trim() || undefined,
        content: form.content?.trim() || undefined,
        fileUrl: form.fileUrl?.trim() || undefined,
        status: form.status,
        categoryId: form.categoryId || undefined,
      };
      if (modal === "create") {
        await createTemplate(payload);
        showToast("Template created", "success");
      } else if (modal === "edit" && selected) {
        await updateTemplate(selected.id, payload);
        showToast(`Template updated — version bumped`, "success");
      }
      closeModal();
      load(page);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteTemplate(selected.id);
      showToast("Template deleted", "success");
      closeModal();
      load(page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Document Templates</h1>
          <p className="text-sm text-muted mt-0.5">{meta.total} template{meta.total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={14} className="mr-1.5" /> New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="relative">
          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
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
            onChange={(e) => setFilterStatus(e.target.value as "" | TemplateStatus)}
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
          {loading ? (
            <TableRow>
              <TableTd colSpan={6} className="text-center text-muted py-10">Loading…</TableTd>
            </TableRow>
          ) : templates.length === 0 ? (
            <TableRow>
              <TableTd colSpan={6} className="text-center text-muted py-10">No templates found</TableTd>
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
              <TableTd><StatusBadge status={tpl.status} /></TableTd>
              <TableTd>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(tpl)}
                    className="p-1.5 rounded hover:bg-surface text-muted hover:text-brand-600 transition-colors"
                    title="Edit"
                    aria-label={`Edit ${tpl.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(tpl)}
                    className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                    title="Delete"
                    aria-label={`Delete ${tpl.name}`}
                  >
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
        <Modal
          title={modal === "create" ? "New Template" : `Edit Template — v${selected?.version}`}
          onClose={closeModal}
          wide
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Template Name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Property Sale Agreement"
              />
              <Input
                label="Template Code"
                value={form.templateCode}
                onChange={(e) => setField("templateCode", e.target.value.toUpperCase())}
                placeholder="TPL-RE-001"
                hint="Uppercase letters, numbers, - or _"
                disabled={modal === "edit"}
              />
            </div>

            <Input
              label="Short Description"
              value={form.shortDescription ?? ""}
              onChange={(e) => setField("shortDescription", e.target.value)}
              placeholder="One-line summary of this template"
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="relative">
                  <select
                    aria-label="Category"
                    value={form.categoryId ?? ""}
                    onChange={(e) => setField("categoryId", e.target.value)}
                    className="w-full h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">— No category —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Status</label>
                <div className="relative">
                  <select
                    aria-label="Status"
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as TemplateStatus)}
                    className="w-full h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Rich text content */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Content</label>
              <RichEditor
                value={form.content ?? ""}
                onChange={(val) => setField("content", val)}
              />
            </div>

            {/* File upload */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Document File <span className="text-muted font-normal">(optional .docx)</span>
              </label>
              {form.fileUrl ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface text-sm">
                  <span className="flex-1 truncate text-muted">{form.fileUrl}</span>
                  <button
                    type="button"
                    onClick={() => setField("fileUrl", "")}
                    aria-label="Remove file"
                    className="text-muted hover:text-red-600 transition-colors"
                  >
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
                    <button
                      type="button"
                      onClick={() => open()}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-surface text-sm text-muted hover:border-brand-400 hover:text-brand-600 transition-colors"
                    >
                      <Upload size={14} />
                      Upload .docx file via Cloudinary
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            {modal === "edit" && (
              <p className="text-xs text-muted bg-amber-50 border border-amber-100 rounded px-3 py-2">
                Saving will auto-increment the patch version (e.g. {selected?.version} → {selected?.version.split(".").map((v, i) => i === 2 ? String(+v + 1) : v).join(".")}).
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
      {modal === "delete" && selected && (
        <Modal title="Delete Template" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete <strong>{selected.name}</strong> ({selected.templateCode})?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
