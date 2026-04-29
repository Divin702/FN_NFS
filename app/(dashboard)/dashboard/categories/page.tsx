"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { categoriesApi, categoriesKeys, type TemplateCategory } from "@/lib/categories-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";

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
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<TemplateCategory | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading } = useQuery({
    queryKey: categoriesKeys.lists(),
    queryFn: categoriesApi.getAll,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKeys.lists() });
      success("Category created");
      closeModal();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "An error occurred"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKeys.lists() });
      success("Category updated");
      closeModal();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "An error occurred"),
  });

  const deleteMut = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKeys.lists() });
      success("Category deleted");
      closeModal();
    },
    onError: (err) => toastError(err instanceof ApiError ? err.message : "Failed to delete"),
  });

  const saving = createMut.isPending || updateMut.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    setFormError("");
  }

  function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    setFormError("");
    const payload = { name: form.name.trim(), description: form.description.trim() || undefined };
    if (modal === "create") {
      createMut.mutate(payload);
    } else if (modal === "edit" && selected) {
      updateMut.mutate({ id: selected.id, data: payload });
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Template Categories" />
      <main className="flex-1 p-5 sm:p-6 overflow-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Categories</h2>
          <p className="text-xs text-muted mt-0.5">
            {isLoading ? "Loading…" : `${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
          </p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<Plus size={14} />}>
          New Category
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
          {isLoading ? (
            <TableRow>
              <TableTd colSpan={4} className="p-0">
                <TableSkeleton rows={5} cols={4} />
              </TableTd>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableTd colSpan={4} className="p-0">
                <EmptyState
                  icon={Tag}
                  title="No categories yet"
                  description="Create your first category to organize document templates."
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus size={14} className="mr-1.5" /> New Category
                    </Button>
                  }
                />
              </TableTd>
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
                    className="p-1.5 rounded cursor-pointer hover:bg-surface text-muted hover:text-brand-600 transition-colors"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(cat)}
                    className="p-1.5 rounded cursor-pointer hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
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
              error={!form.name.trim() ? formError : undefined}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Description <span className="text-muted font-normal">(optional)</span>
              </label>
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
      <ConfirmModal
        open={modal === "delete" && !!selected}
        onClose={() => !deleteMut.isPending && closeModal()}
        onConfirm={() => selected && deleteMut.mutate(selected.id)}
        title="Delete this category?"
        description={
          selected && (
            <>
              <span className="font-medium text-foreground">{selected.name}</span> will be permanently
              deleted. This action cannot be undone.
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
