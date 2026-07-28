"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserX,
  UserCheck,
  Send,
  ChevronDown,
  UserPlus,
  Users,
  Briefcase,
  Check,
  Plus,
  X,
} from "lucide-react";
import {
  usersApi,
  usersKeys,
  type UserRow,
  type UsersParams,
  type Role,
  type UserStatus,
} from "@/lib/users-api";
import { authApi } from "@/lib/auth-api";
import { notaryServicesApi } from "@/lib/notary-services-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
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

const ROLE_LABELS: Record<Role, string> = {
  notary_public: "Notary Public",
  administrator: "Administrator",
};

const ROLE_BADGE: Record<
  Role,
  "default" | "info" | "success" | "warning" | "danger"
> = {
  notary_public: "success",
  administrator: "warning",
};

function getUserStatus(u: UserRow): {
  label: string;
  variant: "success" | "danger" | "warning" | "default";
} {
  if (u.isDisabled) return { label: "Disabled", variant: "danger" };
  if (!u.invitationAccepted && u.invitationExpiresAt) {
    return new Date(u.invitationExpiresAt) < new Date()
      ? { label: "Expired", variant: "danger" }
      : { label: "Pending", variant: "warning" };
  }
  if (u.isActive) return { label: "Active", variant: "success" };
  return { label: "Inactive", variant: "default" };
}

function formatDate(iso?: string) {
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

const emptyInvite = {
  firstName: "",
  lastName: "",
  email: "",
  nationalId: "",
  phoneNumber: "",
  role: "notary_public" as "notary_public" | "administrator",
  organization: "",
  serviceIds: [] as string[],
};

/** Multi-select chips for choosing the services a notary offers. */
function ServicePicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["services-picker"],
    queryFn: () => notaryServicesApi.list({ isActive: true, limit: 200 }),
  });
  const services = data?.data ?? [];

  if (isLoading) {
    return <p className="text-xs text-muted">Loading services…</p>;
  }
  if (services.length === 0) {
    return (
      <p className="text-xs text-muted border border-dashed border-border rounded-lg px-3 py-3 text-center">
        No services defined yet. Create services first, then assign them.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-auto rounded-lg border border-border bg-surface p-2">
      {services.map((s) => {
        const on = selected.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-border bg-white text-muted hover:border-brand-300",
            )}
          >
            {on ? <Check size={12} /> : <Plus size={12} />} {s.name}
          </button>
        );
      })}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { success } = useToast();
  const [form, setForm] = useState(emptyInvite);
  const [formError, setFormError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      authApi.inviteUser({
        ...form,
        organization: form.organization.trim() || undefined,
        serviceIds:
          form.role === "notary_public" && form.serviceIds.length
            ? form.serviceIds
            : undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      success(res.message);
      onClose();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to send invitation.",
      ),
  });

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setFormError("Email is required.");
      return;
    }
    if (!/^\d{16}$/.test(form.nationalId.trim())) {
      setFormError("National ID must be exactly 16 digits.");
      return;
    }
    if (!form.phoneNumber.trim()) {
      setFormError("Phone number is required.");
      return;
    }
    setFormError("");
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserPlus size={16} />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Invite User
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
            label="Email"
            type="email"
            placeholder="jean@example.com"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="National ID"
              placeholder="16-digit National ID"
              required
              inputMode="numeric"
              maxLength={16}
              value={form.nationalId}
              onChange={(e) =>
                set(
                  "nationalId",
                  e.target.value.replace(/\D/g, "").slice(0, 16),
                )
              }
              hint={`${form.nationalId.length}/16 digits`}
            />
            <Input
              label="Phone Number"
              placeholder="+250788000000"
              required
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Role
              </label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) =>
                    set("role", e.target.value as typeof form.role)
                  }
                  className="w-full h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="notary_public">Notary Public</option>
                  <option value="administrator">Administrator</option>
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                />
              </div>
            </div>
            <Input
              label="Organization"
              placeholder="Optional"
              value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
            />
          </div>

          {form.role === "notary_public" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Services this notary offers
              </label>
              <p className="text-xs text-muted -mt-0.5">
                Only these services can be assigned to this notary on a dossier.
              </p>
              <ServicePicker
                selected={form.serviceIds}
                onToggle={(id) =>
                  set(
                    "serviceIds",
                    form.serviceIds.includes(id)
                      ? form.serviceIds.filter((x) => x !== id)
                      : [...form.serviceIds, id],
                  )
                }
              />
            </div>
          )}

          {formError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              {formError}
            </div>
          )}

          <p className="text-xs text-muted bg-blue-50 border border-blue-100 rounded px-3 py-2">
            An invitation email will be sent. The link expires in 6 hours.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={mutation.isPending}
              leftIcon={<Send size={14} />}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Edit the set of services an existing notary offers. */
function ManageServicesModal({
  user,
  onClose,
}: {
  user: UserRow;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [selected, setSelected] = useState<string[]>(
    user.services?.map((s) => s.id) ?? [],
  );

  const mutation = useMutation({
    mutationFn: () => usersApi.setServices(user.id, selected),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      success("Services updated");
      onClose();
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to update services",
      ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Briefcase size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-none">
                Manage Services
              </h2>
              <p className="text-xs text-muted mt-1">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-muted">
            Choose which services this notary offers. Only these can be assigned
            to them on a dossier.
          </p>
          <ServicePicker
            selected={selected}
            onToggle={(id) =>
              setSelected((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Save Services
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ConfirmAction = {
  type: "resend" | "disable" | "enable";
  user: UserRow;
};

export default function UsersPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [params, setParams] = useState<UsersParams>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageUser, setManageUser] = useState<UserRow | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.getAll(params),
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const disableMut = useMutation({
    mutationFn: usersApi.disable,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      success(res.message);
      setConfirm(null);
    },
    onError: (err) =>
      toastError(err instanceof ApiError ? err.message : "Action failed"),
  });

  const enableMut = useMutation({
    mutationFn: usersApi.enable,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      success(res.message);
      setConfirm(null);
    },
    onError: (err) =>
      toastError(err instanceof ApiError ? err.message : "Action failed"),
  });

  const resendMut = useMutation({
    mutationFn: usersApi.resendInvitation,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      success(res.message);
      setConfirm(null);
    },
    onError: (err) =>
      toastError(err instanceof ApiError ? err.message : "Action failed"),
  });

  function busyId() {
    return (
      disableMut.variables ?? enableMut.variables ?? resendMut.variables ?? null
    );
  }

  function runConfirm() {
    if (!confirm) return;
    const id = confirm.user.id;
    if (confirm.type === "resend") resendMut.mutate(id);
    else if (confirm.type === "disable") disableMut.mutate(id);
    else if (confirm.type === "enable") enableMut.mutate(id);
  }

  const confirmPending =
    disableMut.isPending || enableMut.isPending || resendMut.isPending;

  function onSearch(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => setParams((p) => ({ ...p, search: val || undefined, page: 1 })),
      350,
    );
  }

  function onFilter(key: "role" | "status", val: string) {
    setParams((p) => ({
      ...p,
      [key]: (val as Role & UserStatus) || undefined,
      page: 1,
    }));
  }

  const hasFilters = !!(params.search || params.role || params.status);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="User Management" />

        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                All Users
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isLoading
                  ? "Loading…"
                  : `${total} ${total === 1 ? "user" : "users"} total`}
              </p>
            </div>
            <Button
              size="sm"
              leftIcon={<UserPlus size={14} />}
              onClick={() => setInviteOpen(true)}
            >
              Invite User
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Search name, email, National ID…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                leftElement={<Search size={15} />}
              />
            </div>
            <FilterSelect
              value={params.role ?? ""}
              onChange={(v) => onFilter("role", v)}
              placeholder="All Roles"
              options={[
                { value: "notary_public", label: "Notary Public" },
                { value: "administrator", label: "Administrator" },
              ]}
            />
            <FilterSelect
              value={params.status ?? ""}
              onChange={(v) => onFilter("status", v)}
              placeholder="All Statuses"
              options={[
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending Invitation" },
                { value: "disabled", label: "Disabled" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Name</TableTh>
                <TableTh className="hidden sm:table-cell">National ID</TableTh>
                <TableTh className="hidden md:table-cell">Role</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="hidden lg:table-cell">Last Active</TableTh>
                <TableTh className="hidden lg:table-cell">Joined</TableTh>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={7} className="p-0">
                    <EmptyState
                      icon={Users}
                      title={
                        hasFilters
                          ? "No users match your filters"
                          : "No users yet"
                      }
                      description={
                        hasFilters
                          ? "Try adjusting your search or filters."
                          : "Invite team members to get started."
                      }
                      action={
                        !hasFilters ? (
                          <Button
                            size="sm"
                            leftIcon={<UserPlus size={14} />}
                            onClick={() => setInviteOpen(true)}
                          >
                            Invite User
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableTd>
                </TableRow>
              ) : (
                users.map((u) => {
                  const status = getUserStatus(u);
                  const busy = busyId() === u.id;
                  return (
                    <TableRow
                      key={u.id}
                      className={cn(u.isDisabled && "opacity-60")}
                    >
                      <TableTd>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold">
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-muted truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableTd>
                      <TableTd className="hidden sm:table-cell text-muted text-xs font-mono">
                        {u.nationalId}
                      </TableTd>
                      <TableTd className="hidden md:table-cell">
                        <Badge variant={ROLE_BADGE[u.role]}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableTd>
                      <TableTd>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableTd>
                      <TableTd className="hidden lg:table-cell text-xs text-muted">
                        {formatDate(u.lastActiveAt)}
                      </TableTd>
                      <TableTd className="hidden lg:table-cell text-xs text-muted">
                        {formatDate(u.createdAt)}
                      </TableTd>
                      <TableTd>
                        <div className="flex items-center gap-1.5">
                          {u.role === "notary_public" && (
                            <button
                              type="button"
                              title="Manage services"
                              onClick={() => setManageUser(u)}
                              className="p-1.5 rounded cursor-pointer text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            >
                              <Briefcase size={14} />
                            </button>
                          )}
                          {!u.invitationAccepted && (
                            <button
                              type="button"
                              disabled={busy}
                              title="Resend Invitation"
                              onClick={() =>
                                setConfirm({ type: "resend", user: u })
                              }
                              className="p-1.5 rounded cursor-pointer text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          {u.isDisabled ? (
                            <button
                              type="button"
                              disabled={busy}
                              title="Enable user"
                              onClick={() =>
                                setConfirm({ type: "enable", user: u })
                              }
                              className="p-1.5 rounded cursor-pointer text-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <UserCheck size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              title="Disable user"
                              onClick={() =>
                                setConfirm({ type: "disable", user: u })
                              }
                              className="p-1.5 rounded cursor-pointer text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </TableTd>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">
                Page {params.page} of {totalPages}
              </p>
              <Pagination
                page={params.page ?? 1}
                totalPages={totalPages}
                onPageChange={(p) =>
                  setParams((prev) => ({ ...prev, page: p }))
                }
              />
            </div>
          )}
        </main>
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      {manageUser && (
        <ManageServicesModal
          user={manageUser}
          onClose={() => setManageUser(null)}
        />
      )}

      <ConfirmModal
        open={confirm?.type === "resend"}
        onClose={() => !confirmPending && setConfirm(null)}
        onConfirm={runConfirm}
        title="Resend invitation?"
        description={
          confirm?.user && (
            <>
              A new invitation email will be sent to{" "}
              <span className="font-medium text-foreground">
                {confirm.user.email}
              </span>
              . The previous link will stop working.
            </>
          )
        }
        confirmLabel="Yes, resend"
        tone="info"
        loading={confirmPending}
      />

      <ConfirmModal
        open={confirm?.type === "disable"}
        onClose={() => !confirmPending && setConfirm(null)}
        onConfirm={runConfirm}
        title="Disable this user?"
        description={
          confirm?.user && (
            <>
              <span className="font-medium text-foreground">
                {confirm.user.firstName} {confirm.user.lastName}
              </span>{" "}
              will no longer be able to sign in. You can re-enable them at any
              time.
            </>
          )
        }
        confirmLabel="Disable user"
        tone="danger"
        loading={confirmPending}
      />

      <ConfirmModal
        open={confirm?.type === "enable"}
        onClose={() => !confirmPending && setConfirm(null)}
        onConfirm={runConfirm}
        title="Re-enable this user?"
        description={
          confirm?.user && (
            <>
              <span className="font-medium text-foreground">
                {confirm.user.firstName} {confirm.user.lastName}
              </span>{" "}
              will regain access to their account.
            </>
          )
        }
        confirmLabel="Enable user"
        tone="success"
        loading={confirmPending}
      />
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 appearance-none pl-3 pr-8 rounded-md border border-border bg-white text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
          "transition-shadow cursor-pointer",
          !value && "text-muted",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
