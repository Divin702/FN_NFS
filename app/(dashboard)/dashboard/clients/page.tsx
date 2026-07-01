"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Users,
  X,
  Pencil,
  Trash2,
  Camera,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  clientsApi,
  clientsKeys,
  type Client,
  type CreateClientBody,
  type UpdateClientBody,
} from "@/lib/clients-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";
import { WebcamCapture } from "@/components/dashboard/WebcamCapture";
import { IDScanner } from "@/components/ui/IDScanner";
import { FingerprintIdentify } from "@/components/fingerprint/FingerprintIdentify";
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
import { getUser } from "@/lib/auth";

const LIMIT = 20;

async function uploadToCloudinary(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("file", blob, "photo.jpg");
  form.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  );
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: form },
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("Photo upload failed.");
  return data.secure_url as string;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(c: Client) {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

// ─── Registration / Edit panel ───────────────────────────────────────────────

interface PanelProps {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

function ClientPanel({ client, onClose, onSaved }: PanelProps) {
  const { success } = useToast();
  const [form, setForm] = useState({
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    nationalId: client?.nationalId ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    photoUrl: client?.photoUrl ?? "",
  });
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const createMut = useMutation({
    mutationFn: (body: CreateClientBody) => clientsApi.create(body),
    onSuccess: () => {
      success(client ? "Client updated." : "Client registered.");
      onSaved();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save client.",
      ),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClientBody }) =>
      clientsApi.update(id, body),
    onSuccess: () => {
      success("Client updated.");
      onSaved();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save client.",
      ),
  });

  const isPending = createMut.isPending || updateMut.isPending || uploading;

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    if (!/^\d{16}$/.test(form.nationalId)) {
      setFormError("National ID must be exactly 16 digits.");
      return;
    }
    setFormError("");

    let photoUrl = form.photoUrl;

    // Upload newly captured photo
    if (capturedDataUrl) {
      setUploading(true);
      try {
        photoUrl = await uploadToCloudinary(capturedDataUrl);
      } catch {
        setFormError("Photo upload failed. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const body = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      nationalId: form.nationalId,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      photoUrl: photoUrl || undefined,
    };

    if (client) {
      updateMut.mutate({ id: client.id, body });
    } else {
      createMut.mutate(body);
    }
  }

  const previewSrc = capturedDataUrl ?? (form.photoUrl || null);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => !isPending && onClose()}
      />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserPlus size={16} />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {client ? "Edit Client" : "Register New Client"}
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Jean"
              required
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
            <Input
              label="Last Name"
              placeholder="Mugisha"
              required
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          <Input
            label="National ID"
            placeholder="16-digit National ID"
            required
            inputMode="numeric"
            maxLength={16}
            value={form.nationalId}
            onChange={(e) =>
              set("nationalId", e.target.value.replace(/\D/g, "").slice(0, 16))
            }
            hint={`${form.nationalId.length}/16 digits`}
          />
          <IDScanner
            label="Or scan ID card photo"
            onScanned={({ nationalId }) => set("nationalId", nationalId)}
          />

          <Input
            label="Phone"
            placeholder="+250788000000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="jean@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />

          {/* Photo section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Photo</label>

            {!showCamera ? (
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center">
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSrc}
                      alt="Client photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff size={22} className="text-muted" />
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Camera size={14} />}
                    onClick={() => setShowCamera(true)}
                  >
                    {previewSrc ? "Retake Photo" : "Open Camera"}
                  </Button>
                  {previewSrc && (
                    <p className="text-xs text-muted">Photo captured</p>
                  )}
                  {!previewSrc && (
                    <p className="text-xs text-muted">No photo captured yet</p>
                  )}
                </div>
              </div>
            ) : (
              <WebcamCapture
                onCapture={(dataUrl) => {
                  setCapturedDataUrl(dataUrl);
                  setShowCamera(false);
                }}
                onCancel={() => setShowCamera(false)}
              />
            )}
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
            {client ? "Save Changes" : "Register Client"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [panelClient, setPanelClient] = useState<Client | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const currentUser = getUser();
  const canDelete =
    currentUser?.role === "administrator" || currentUser?.role === "notary_public";

  const queryParams = { q: debouncedSearch || undefined, page, limit: LIMIT };

  const { data, isLoading } = useQuery({
    queryKey: clientsKeys.list(queryParams),
    queryFn: () => clientsApi.list(queryParams),
  });

  const clients = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const deleteMut = useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientsKeys.lists() });
      success("Client deleted.");
      setDeleteTarget(null);
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to delete client.",
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
    qc.invalidateQueries({ queryKey: clientsKeys.lists() });
    setPanelClient(null);
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Clients" />

        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                All Clients
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isLoading
                  ? "Loading…"
                  : `${total} registered ${total === 1 ? "client" : "clients"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FingerprintIdentify />
              <Button
                size="sm"
                leftIcon={<UserPlus size={14} />}
                onClick={() => setPanelClient("new")}
              >
                Register Client
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-5 max-w-sm">
            <Input
              placeholder="Search name, National ID, phone…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              leftElement={<Search size={15} />}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Client</TableTh>
                <TableTh className="hidden sm:table-cell">National ID</TableTh>
                <TableTh className="hidden md:table-cell">Phone</TableTh>
                <TableTh className="hidden lg:table-cell">Email</TableTh>
                <TableTh className="hidden lg:table-cell">Registered</TableTh>
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
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={6} className="p-0">
                    <EmptyState
                      icon={Users}
                      title={
                        debouncedSearch
                          ? "No clients match your search"
                          : "No clients yet"
                      }
                      description={
                        debouncedSearch
                          ? "Try a different name or National ID."
                          : "Register the first client to get started."
                      }
                      action={
                        !debouncedSearch ? (
                          <Button
                            size="sm"
                            leftIcon={<UserPlus size={14} />}
                            onClick={() => setPanelClient("new")}
                          >
                            Register Client
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableTd>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow key={c.id}>
                    {/* Photo + name */}
                    <TableTd>
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                          {c.photoUrl ? (
                            <Image
                              src={c.photoUrl}
                              alt={`${c.firstName} ${c.lastName}`}
                              width={36}
                              height={36}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-brand-600">
                              {initials(c)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {c.firstName} {c.lastName}
                          </p>
                          {c.email && (
                            <p className="text-xs text-muted truncate">
                              {c.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableTd>

                    <TableTd className="hidden sm:table-cell text-xs font-mono text-muted">
                      {c.nationalId}
                    </TableTd>

                    <TableTd className="hidden md:table-cell text-xs text-muted">
                      {c.phone ?? "—"}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-xs text-muted">
                      {c.email ?? "—"}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-xs text-muted">
                      {formatDate(c.createdAt)}
                    </TableTd>

                    <TableTd>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/clients/${c.id}`}
                          title="View client"
                          className="p-1.5 rounded text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          type="button"
                          title="Edit client"
                          onClick={() => setPanelClient(c)}
                          className="p-1.5 rounded cursor-pointer text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            title="Delete client"
                            onClick={() => setDeleteTarget(c)}
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

      {/* Registration / Edit panel */}
      {panelClient !== null && (
        <ClientPanel
          client={panelClient === "new" ? null : panelClient}
          onClose={() => setPanelClient(null)}
          onSaved={afterSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => !deleteMut.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete this client?"
        description={
          deleteTarget && (
            <>
              <span className="font-medium text-foreground">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>{" "}
              will be permanently removed. This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete client"
        tone="danger"
        loading={deleteMut.isPending}
      />
    </>
  );
}
