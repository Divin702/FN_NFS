"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { identifier, password });
      saveAuth(res.accessToken, res.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Sign in with your email or National ID
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Email or National ID</label>
          <input
            type="text"
            placeholder="john@example.com or 1199800012345"
            required
            autoFocus
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-800 px-4 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors duration-150"
        >
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
