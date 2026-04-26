"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";

interface RegisterResponse {
  accessToken: string;
  user: AuthUser;
}

interface Field {
  name: keyof FormData;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  nationalId: string;
  phoneNumber: string;
  password: string;
}

const fields: Field[] = [
  { name: "firstName",   label: "First Name",   placeholder: "John",              autoComplete: "given-name" },
  { name: "lastName",    label: "Last Name",    placeholder: "Doe",               autoComplete: "family-name" },
  { name: "email",       label: "Email",        placeholder: "john@example.com",  type: "email", autoComplete: "email" },
  { name: "nationalId",  label: "National ID",  placeholder: "1199800012345" },
  { name: "phoneNumber", label: "Phone Number", placeholder: "+250788000000",     type: "tel",   autoComplete: "tel" },
];

const EMPTY: FormData = {
  firstName: "", lastName: "", email: "",
  nationalId: "", phoneNumber: "", password: "",
};

export default function RegisterPage() {
  const router   = useRouter();
  const [form, setForm]     = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.firstName.trim())  errs.firstName   = "First name is required";
    if (!form.lastName.trim())   errs.lastName    = "Last name is required";
    if (!form.email.trim())      errs.email       = "Email is required";
    if (!form.nationalId.trim()) errs.nationalId  = "National ID is required";
    if (!form.phoneNumber.trim())errs.phoneNumber = "Phone number is required";
    if (form.password.length < 8) errs.password   = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>("/auth/register", form);
      saveAuth(res.accessToken, res.user);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted">
          Free for all citizens · Takes less than 2 minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          {fields.slice(0, 2).map((f) => (
            <Input
              key={f.name}
              label={f.label}
              placeholder={f.placeholder}
              required
              autoComplete={f.autoComplete}
              value={form[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              error={errors[f.name]}
            />
          ))}
        </div>

        {fields.slice(2).map((f) => (
          <Input
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            type={f.type ?? "text"}
            required
            autoComplete={f.autoComplete}
            value={form[f.name]}
            onChange={(e) => set(f.name, e.target.value)}
            error={errors[f.name]}
          />
        ))}

        <Input
          label="Password"
          placeholder="Min. 8 characters"
          required
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
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

        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-1"
          loading={loading}
          leftIcon={<UserPlus size={16} />}
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
