"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "@/components/ui/Table";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type TemplateCategory,
} from "@/lib/categories-api";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<TemplateCategory | null>(null);

  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ name: "", description: "" });
    setFormError("");
    setModal("create");
  }

  function openEdit(cat: TemplateCategory) {
    setSelected(cat);
    setForm({ name: cat.name, description: cat.description ?? "" });
    setFormError("");
    setModal("edit");
  }

  function openDelete(cat: TemplateCategory) {
    setSelected(cat);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    setSaving(true);
    setFormError("");
    try {
      if (modal === "create") {
        await createCategory({ name: form.name.trim(), description: form.description.trim() || undefined });
        showToast("Category created", "success");
      } else if (modal === "edit" && selected) {
        await updateCategory(selected.id, { name: form.name.trim(), description: form.description.trim() || undefined });
        showToast("Category updated", "success");
      }
      closeModal();
      await load();
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
      await deleteCategory(selected.id);
      showToast("Category deleted", "success");
      closeModal();
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
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
          <h1 className="text-xl font-semibold text-foreground">Template Categories</h1>
          <p className="text-sm text-muted mt-0.5">Manage document template categories</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={14} className="mr-1.5" /> New Category
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableTh>Name</TableTh>
            <TableTh>Slug</TableTh>
            <TableTh>Description</TableTh>
            <TableTh className="w-24">Actions</TableTh>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableTd colSpan={4} className="text-center text-muted py-10">Loading…</TableTd>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableTd colSpan={4} className="text-center text-muted py-10">No categories yet</TableTd>
            </TableRow>
          ) : categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableTd className="font-medium text-foreground">{cat.name}</TableTd>
              <TableTd>
                <code className="text-xs bg-surface px-1.5 py-0.5 rounded text-muted">{cat.slug}</code>
              </TableTd>
              <TableTd className="text-muted text-sm">{cat.description ?? "—"}</TableTd>
              <TableTd>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded hover:bg-surface text-muted hover:text-brand-600 transition-colors"
                    title="Edit"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(cat)}
                    className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                    title="Delete"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </TableTd>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "New Category" : "Edit Category"} onClose={closeModal}>
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Real Estate"
              error={formError && !form.name.trim() ? formError : undefined}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Description <span className="text-muted font-normal">(optional)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description of this category"
                rows={3}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            {formError && form.name.trim() && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                {modal === "create" ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal === "delete" && selected && (
        <Modal title="Delete Category" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete <strong>{selected.name}</strong>?
              This action cannot be undone.
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
