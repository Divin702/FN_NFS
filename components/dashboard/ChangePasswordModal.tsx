"use client";

import { useState } from "react";
import { Eye, EyeOff, X, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/auth-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
interface Props {
  onClose: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

export function ChangePasswordModal({ onClose }: Props) {
  const { success } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const nextOk = PASSWORD_REGEX.test(next);
  const confirmOk = next === confirm && confirm.length > 0;
  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: (res) => {
      success(res.message);
      onClose();
    },
    onError: (err) =>
      setFieldError(
        err instanceof ApiError ? err.message : "Failed to change password.",
      ),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current.trim()) {
      setFieldError("Current password is required.");
      return;
    }
    if (!nextOk) {
      setFieldError(
        "New password must be 8+ characters with uppercase, lowercase, number, and special character.",
      );
      return;
    }
    if (!confirmOk) {
      setFieldError("New passwords do not match.");
      return;
    }
    setFieldError("");
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Lock size={16} />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Change Password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Current password"
            type={showCurrent ? "text" : "password"}
            placeholder="Your current password"
            required
            autoFocus
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="text-muted hover:text-foreground transition-colors"
                aria-label={showCurrent ? "Hide" : "Show"}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <div className="flex flex-col gap-1">
            <Input
              label="New password"
              type={showNext ? "text" : "password"}
              placeholder="At least 8 characters"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNext(!showNext)}
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label={showNext ? "Hide" : "Show"}
                >
                  {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            {next && (
              <div className="flex gap-1 mt-1">
                {[
                  /[a-z]/.test(next),
                  /[A-Z]/.test(next),
                  /\d/.test(next),
                  /[!@#$%^&*]/.test(next),
                  next.length >= 8,
                ].map((ok, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-green-500" : "bg-border"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <Input
            label="Confirm new password"
            type="password"
            placeholder="Repeat new password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            error={confirm && !confirmOk ? "Passwords do not match" : undefined}
          />

          {fieldError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              {fieldError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={mutation.isPending}
              disabled={!current || !nextOk || !confirmOk}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
