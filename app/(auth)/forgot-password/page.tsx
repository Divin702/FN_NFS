"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-5">
          <CheckCircle size={28} />
        </div>
        <h1 className="text-xl font-bold text-white">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
          If <span className="font-medium text-white">{email}</span> is
          registered, you&apos;ll receive a password reset link within a few
          minutes.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          The link expires in <span className="font-medium">1 hour</span>. Check
          your spam folder if you don&apos;t see it.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Try a different email
          </Button>
          <Link
            href="/login"
            className="text-sm text-center text-brand-600 hover:text-brand-700 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
          <Mail size={22} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Forgot password?
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full mt-1" loading={loading}>
          Send reset link
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  );
}
