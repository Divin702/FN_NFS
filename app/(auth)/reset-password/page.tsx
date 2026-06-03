"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token)
      setError("Invalid or missing reset token. Please request a new link.");
  }, [token]);

  const passwordOk = PASSWORD_REGEX.test(password);
  const confirmOk = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordOk) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      );
      return;
    }
    if (!confirmOk) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-5">
          <CheckCircle size={28} />
        </div>
        <h1 className="text-xl font-bold text-white">Password reset!</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your password has been changed. Redirecting to sign in…
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Go to sign in now
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-5">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-xl font-bold text-white">Invalid link</h1>
        <p className="mt-2 text-sm text-slate-400">
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
          <KeyRound size={22} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Set new password
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Input
            label="New password"
            type={showPw ? "text" : "password"}
            placeholder="At least 8 characters"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {password && (
            <div className="flex gap-1 mt-1">
              {[
                /[a-z]/.test(password),
                /[A-Z]/.test(password),
                /\d/.test(password),
                /[!@#$%^&*]/.test(password),
                password.length >= 8,
              ].map((ok, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-emerald-500" : "bg-border"}`}
                />
              ))}
            </div>
          )}
          {password && !passwordOk && (
            <p className="text-xs text-slate-400 mt-1">
              Needs uppercase, lowercase, number, and special character
              (!@#$%^&*)
            </p>
          )}
        </div>

        <Input
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={confirm && !confirmOk ? "Passwords do not match" : undefined}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-1"
          loading={loading}
          disabled={!passwordOk || !confirmOk}
        >
          Reset password
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center text-sm text-slate-400 hover:text-white transition-colors"
      >
        Back to sign in
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
