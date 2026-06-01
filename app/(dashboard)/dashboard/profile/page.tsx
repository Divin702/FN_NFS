"use client";

import { useState, useEffect, startTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  Hash,
  Building2,
  MapPin,
  Camera,
  CheckCircle2,
  Lock,
  Shield,
  User,
} from "lucide-react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Topbar } from "@/components/dashboard/Topbar";
import { api, ApiError } from "@/lib/api";
import { getUser, saveAuth, getToken, type AuthUser } from "@/lib/auth";
import { useToast } from "@/components/providers/ToastProvider";

interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  address?: string;
  organization?: string;
  picture?: string;
}

const profileKeys = { me: ["profile", "me"] as const };

const ROLE_LABELS: Record<string, string> = {
  notary_public: "Notary Public",
  administrator: "Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  notary_public: "bg-emerald-50 text-emerald-700",
  administrator: "bg-amber-50 text-amber-700",
};

export default function ProfilePage() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();

  // Seed instantly from localStorage — no empty flash
  const cached = typeof window !== "undefined" ? getUser() : null;

  const [form, setForm] = useState({
    firstName: cached?.firstName ?? "",
    lastName: cached?.lastName ?? "",
    address: cached?.address ?? "",
    organization: cached?.organization ?? "",
    picture: cached?.picture ?? "",
  });
  const [savedState, setSavedState] = useState({ ...form });
  const [justSaved, setJustSaved] = useState(false);

  // Fetch fresh from server
  const { data: profile } = useQuery({
    queryKey: profileKeys.me,
    queryFn: () => api.get<AuthUser>("/auth/me"),
    staleTime: 30_000,
  });

  // When server data arrives, sync form (only if user hasn't started editing)
  useEffect(() => {
    if (!profile) return;
    const next = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      address: profile.address ?? "",
      organization: profile.organization ?? "",
      picture: profile.picture ?? "",
    };
    setForm(next);
    setSavedState(next);
  }, [profile]);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const dirty =
    form.firstName !== savedState.firstName ||
    form.lastName !== savedState.lastName ||
    form.address !== savedState.address ||
    form.organization !== savedState.organization ||
    form.picture !== savedState.picture;

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileDto) =>
      api.patch<AuthUser>("/auth/me", data),
    onSuccess: (updated) => {
      const token = getToken();
      const stored = getUser();
      if (token && stored) saveAuth(token, { ...stored, ...updated });
      qc.invalidateQueries({ queryKey: profileKeys.me });
      const next = { ...form };
      setSavedState(next);
      // Let Topbar re-read localStorage
      startTransition(() => {});
      success("Profile updated successfully.");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to update profile.",
      ),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toastError("First and last name are required.");
      return;
    }
    mutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address: form.address.trim() || undefined,
      organization: form.organization.trim() || undefined,
      picture: form.picture || undefined,
    });
  }

  const displayName =
    `${form.firstName || profile?.firstName || ""} ${form.lastName || profile?.lastName || ""}`.trim();
  const roleKey = profile?.role ?? cached?.role ?? "";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="My Profile" />

      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* ── Avatar + identity card ── */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Color band */}
            <div className="h-28 bg-linear-to-br from-brand-600 to-brand-400 relative">
              {/* Subtle pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            {/* Avatar row */}
            <div className="px-6 pb-6 -mt-12 flex items-end gap-5">
              <div className="relative shrink-0">
                {form.picture ? (
                  <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.picture}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => set("picture", "")}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full"
                      title="Remove photo"
                    >
                      <span className="text-white text-xs font-medium">
                        Remove
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="ring-4 ring-white rounded-full shadow-lg">
                    <AvatarUpload
                      value=""
                      onChange={(url) => set("picture", url)}
                      name={profile?.id ?? "avatar"}
                      size="lg"
                    />
                  </div>
                )}
                {!form.picture && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 shadow text-white border-2 border-white">
                    <Camera size={13} />
                  </span>
                )}
              </div>

              <div className="pb-1 min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate leading-tight">
                      {displayName || "—"}
                    </h2>
                    <p className="text-sm text-muted mt-0.5 truncate">
                      {profile?.email ?? cached?.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[roleKey] ?? "bg-zinc-100 text-zinc-700"}`}
                  >
                    <Shield size={11} />
                    {ROLE_LABELS[roleKey] ?? roleKey}
                  </span>
                </div>
              </div>
            </div>

            {/* Read-only identity strip */}
            <div className="mx-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
              <ReadCell
                icon={<Mail size={14} />}
                label="Email"
                value={profile?.email ?? cached?.email ?? "—"}
              />
              <ReadCell
                icon={<Phone size={14} />}
                label="Phone"
                value={profile?.phoneNumber ?? cached?.phoneNumber ?? "—"}
              />
              <ReadCell
                icon={<Hash size={14} />}
                label="National ID"
                value={profile?.nationalId ?? cached?.nationalId ?? "—"}
              />
            </div>
          </div>

          {/* ── Edit form ── */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Personal Details
                  </h3>
                  <p className="text-xs text-muted">
                    Update your name, organization, and address
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Jean"
                    required
                    autoComplete="given-name"
                  />
                  <Input
                    label="Last Name"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Mugisha"
                    required
                    autoComplete="family-name"
                  />
                </div>

                <Input
                  label="Organization"
                  value={form.organization}
                  onChange={(e) => set("organization", e.target.value)}
                  placeholder="e.g. Ministry of Justice"
                  leftElement={<Building2 size={14} />}
                  autoComplete="organization"
                />

                <Input
                  label="Address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="e.g. KG 123 St, Kigali"
                  leftElement={<MapPin size={14} />}
                  autoComplete="street-address"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/50">
                <div className="flex items-center gap-1.5 text-xs">
                  {justSaved ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span className="text-emerald-600 font-medium">
                        Saved successfully
                      </span>
                    </>
                  ) : dirty ? (
                    <span className="text-amber-600 font-medium">
                      You have unsaved changes
                    </span>
                  ) : (
                    <span className="text-muted">No pending changes</span>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  loading={mutation.isPending}
                  disabled={!dirty || mutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>

          {/* ── Security card ── */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Lock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Security
                </h3>
                <p className="text-xs text-muted">Manage your password</p>
              </div>
            </div>
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-xs text-muted mt-0.5">
                  Use a strong password with uppercase, lowercase, numbers, and
                  symbols.
                </p>
              </div>
              <ChangePasswordInline />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReadCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 bg-surface/60">
      <span className="text-muted shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// Inline change-password section — no modal needed on a full page
function ChangePasswordInline() {
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  const nextOk = PW_REGEX.test(next);
  const confirmOk = next === confirm && confirm.length > 0;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      }),
    onSuccess: (res) => {
      success(res.message);
      setOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to change password.",
      ),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nextOk) {
      toastError("Password doesn't meet requirements.");
      return;
    }
    if (!confirmOk) {
      toastError("Passwords do not match.");
      return;
    }
    mutate();
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        leftIcon={<Lock size={13} />}
      >
        Change Password
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 pt-1">
      <div className="relative">
        <Input
          label="Current password"
          type={showCurrent ? "text" : "password"}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoFocus
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="text-muted hover:text-foreground transition-colors text-xs"
            >
              {showCurrent ? "Hide" : "Show"}
            </button>
          }
        />
      </div>
      <div>
        <Input
          label="New password"
          type={showNext ? "text" : "password"}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowNext(!showNext)}
              className="text-muted hover:text-foreground transition-colors text-xs"
            >
              {showNext ? "Hide" : "Show"}
            </button>
          }
        />
        {next && (
          <div className="flex gap-1 mt-1.5">
            {[
              /[a-z]/.test(next),
              /[A-Z]/.test(next),
              /\d/.test(next),
              /[!@#$%^&*]/.test(next),
              next.length >= 8,
            ].map((ok, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-emerald-500" : "bg-border"}`}
              />
            ))}
          </div>
        )}
      </div>
      <Input
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
        error={confirm && !confirmOk ? "Passwords do not match" : undefined}
      />
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setOpen(false);
            setCurrent("");
            setNext("");
            setConfirm("");
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={isPending}
          disabled={!current || !nextOk || !confirmOk}
        >
          Update Password
        </Button>
      </div>
    </form>
  );
}
