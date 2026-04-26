"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";

interface SetPasswordResponse {
  accessToken: string;
  user: AuthUser;
}

function AcceptInvitationForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid invitation link. Please check the email you received.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<SetPasswordResponse>("/auth/set-password", { token, password });
      saveAuth(res.accessToken, res.user);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Account activated!</h2>
        <p className="text-sm text-muted">
          Your password has been set. Redirecting you to the dashboard…
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 mb-4">
          <Lock size={22} className="text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Set your password
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          You&apos;ve been invited to NFS. Create a password to activate your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="New Password"
          placeholder="Min. 8 characters"
          required
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="text-muted hover:text-foreground transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          label="Confirm Password"
          placeholder="Repeat your password"
          required
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-1"
          loading={loading}
          disabled={!token}
        >
          Activate Account
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationForm />
    </Suspense>
  );
}
