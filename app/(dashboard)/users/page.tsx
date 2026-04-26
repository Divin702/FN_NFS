"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, RefreshCw, UserX, UserCheck, Send, ChevronDown } from "lucide-react";
import {
  getUsers, disableUser, enableUser, resendInvitation,
  type UserRow, type UsersParams, type Role, type UserStatus,
} from "@/lib/users-api";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import {
  Table, TableHead, TableBody, TableRow, TableTh, TableTd,
} from "@/components/ui/Table";
import { cn } from "@/lib/cn";

/* ── helpers ── */
const ROLE_LABELS: Record<Role, string> = {
  citizen:       "Citizen",
  legal_clerk:   "Legal Clerk",
  notary_public: "Notary Public",
  administrator: "Administrator",
};

const ROLE_BADGE: Record<Role, "default" | "info" | "success" | "warning" | "danger"> = {
  citizen:       "default",
  legal_clerk:   "info",
  notary_public: "success",
  administrator: "warning",
};

function getUserStatus(u: UserRow): { label: string; variant: "success" | "danger" | "warning" | "default" } {
  if (u.isDisabled)                                                  return { label: "Disabled",  variant: "danger"  };
  if (!u.invitationAccepted && u.invitationExpiresAt) {
    const expired = new Date(u.invitationExpiresAt) < new Date();
    if (expired) return { label: "Expired",   variant: "danger"  };
    return           { label: "Pending",   variant: "warning" };
  }
  if (u.isActive)                                                    return { label: "Active",    variant: "success" };
  return                                                             { label: "Inactive",  variant: "default" };
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── component ── */
export default function UsersPage() {
  const [params, setParams]   = useState<UsersParams>({ page: 1, limit: 20 });
  const [search, setSearch]   = useState("");
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const searchTimer           = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: UsersParams) => {
    setLoading(true);
    try {
      const res = await getUsers(p);
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      showToast("Failed to load users", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(params); }, [params, load]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function onSearch(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setParams((p) => ({ ...p, search: val || undefined, page: 1 }));
    }, 350);
  }

  function onFilter(key: "role" | "status", val: string) {
    setParams((p) => ({ ...p, [key]: val || undefined, page: 1 }));
  }

  async function handleAction(action: "disable" | "enable" | "resend", id: string) {
    setActionId(id);
    try {
      const fn = action === "disable" ? disableUser : action === "enable" ? enableUser : resendInvitation;
      const res = await fn(id);
      showToast(res.message, true);
      load(params);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Action failed", false);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="User Management" />

      <main className="flex-1 p-5 sm:p-6 overflow-auto">
        {/* header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">All Users</h2>
            <p className="text-xs text-muted mt-0.5">
              {total} {total === 1 ? "user" : "users"} total
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            loading={loading}
            onClick={() => load(params)}
          >
            Refresh
          </Button>
        </div>

        {/* filters */}
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
              { value: "citizen",       label: "Citizen" },
              { value: "legal_clerk",   label: "Legal Clerk" },
              { value: "notary_public", label: "Notary Public" },
              { value: "administrator", label: "Administrator" },
            ]}
          />

          <FilterSelect
            value={params.status ?? ""}
            onChange={(v) => onFilter("status", v)}
            placeholder="All Statuses"
            options={[
              { value: "active",   label: "Active" },
              { value: "pending",  label: "Pending Invitation" },
              { value: "disabled", label: "Disabled" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        {/* table */}
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
            {loading && users.length === 0 ? (
              <TableRow>
                <TableTd colSpan={7} className="text-center py-12 text-muted">
                  Loading…
                </TableTd>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableTd colSpan={7} className="text-center py-12 text-muted">
                  No users found
                </TableTd>
              </TableRow>
            ) : (
              users.map((u) => {
                const status = getUserStatus(u);
                const busy   = actionId === u.id;
                return (
                  <TableRow key={u.id} className={cn(u.isDisabled && "opacity-60")}>
                    {/* Name + email */}
                    <TableTd>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-muted truncate">{u.email}</p>
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

                    {/* Actions */}
                    <TableTd>
                      <div className="flex items-center gap-1.5">
                        {/* Resend invite — only for pending/expired invitations */}
                        {!u.invitationAccepted && (
                          <button
                            type="button"
                            disabled={busy}
                            title="Resend Invitation"
                            onClick={() => handleAction("resend", u.id)}
                            className="p-1.5 rounded text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-40"
                          >
                            <Send size={14} />
                          </button>
                        )}

                        {/* Disable / Enable */}
                        {u.isDisabled ? (
                          <button
                            type="button"
                            disabled={busy}
                            title="Enable user"
                            onClick={() => handleAction("enable", u.id)}
                            className="p-1.5 rounded text-muted hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                          >
                            <UserCheck size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            title="Disable user"
                            onClick={() => handleAction("disable", u.id)}
                            className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
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

        {/* pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted">
              Page {params.page} of {totalPages}
            </p>
            <Pagination
              page={params.page ?? 1}
              totalPages={totalPages}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all",
            toast.ok ? "bg-green-600" : "bg-red-600"
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── tiny filter select ── */
function FilterSelect({
  value, onChange, placeholder, options,
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
          !value && "text-muted"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}
