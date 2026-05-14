"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FolderPlus,
  FolderOpen,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  Camera,
  ImageOff,
  CheckCircle2,
  Printer,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  dossiersApi,
  dossiersKeys,
  type Dossier,
  type DossierStatus,
  type CreateDossierBody,
} from "@/lib/dossiers-api";
import { clientsApi, clientsKeys, type Client } from "@/lib/clients-api";
import { usersApi, type UserRow } from "@/lib/users-api";
import {
  notaryServicesApi,
  type NotaryService,
} from "@/lib/notary-services-api";
import { templatesApi, type DocumentTemplate } from "@/lib/templates-api";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import { Topbar } from "@/components/dashboard/Topbar";
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
import { WebcamCapture } from "@/components/dashboard/WebcamCapture";
import { cn } from "@/lib/cn";

const LIMIT = 20;

const STATUS_TABS: { label: string; value: DossierStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

const STATUS_BADGE: Record<
  DossierStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700" },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700",
  },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-600" },
};

function StatusBadge({ status }: { status: DossierStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFee(n: number) {
  return n.toLocaleString("en-RW") + " RWF";
}

function getIsAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return user?.role === "administrator";
  } catch {
    return false;
  }
}

function clientInitials(c: { firstName: string; lastName: string }) {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

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

function printDocument(
  template: DocumentTemplate,
  filledFields: Record<string, string>,
  client: Client,
  service: NotaryService,
  notaryFee: number,
) {
  let html = template.content ?? "";
  const totalFee = service.officialFee + notaryFee;

  const replacements: Record<string, string> = {
    clientName: `${client.firstName} ${client.lastName}`,
    clientNationalId: client.nationalId,
    serviceName: service.name,
    officialFee: formatFee(service.officialFee),
    notaryFee: formatFee(notaryFee),
    totalFee: formatFee(totalFee),
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    ...filledFields,
  };

  for (const [key, val] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, val);
  }

  const markup = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Dossier Document</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: serif; font-size: 12pt; padding: 40px; color: #111; }
  </style>
</head>
<body>
${html}
<div class="no-print" style="margin-top:40px;text-align:center">
  <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer">Print</button>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;
  const blob = new Blob([markup], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("unload", () => URL.revokeObjectURL(url), {
      once: true,
    });
  }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-surface shrink-0">
      {([1, 2, 3] as const).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
              step === s
                ? "bg-brand-500 text-white"
                : step > s
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-muted",
            )}
          >
            {step > s ? <CheckCircle2 size={13} /> : s}
          </div>
          <span
            className={cn(
              "text-xs font-medium hidden sm:inline",
              step === s ? "text-foreground" : "text-muted",
            )}
          >
            {s === 1 ? "Client" : s === 2 ? "Service" : "Review"}
          </span>
          {s < 3 && <div className="w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

// ─── 3-Step Wizard Panel ────────────────────────────────────────────────────────

interface WizardPanelProps {
  onClose: () => void;
  onSaved: () => void;
}

function NewDossierPanel({ onClose, onSaved }: WizardPanelProps) {
  const { success } = useToast();

  // ── Step state ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1: Client ──
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const clientSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // New client inline form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    phone: "",
  });
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [step1Error, setStep1Error] = useState("");

  // ── Step 2: Service & Fees ──
  const [selectedService, setSelectedService] = useState<NotaryService | null>(
    null,
  );
  const [notaryFee, setNotaryFee] = useState(0);
  const [filledFields, setFilledFields] = useState<Record<string, string>>({});
  const [step2Error, setStep2Error] = useState("");

  // ── Step 3: Review ──
  const [selectedNotaryId, setSelectedNotaryId] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  // ── Post-creation state ──
  const [createdDossier, setCreatedDossier] = useState<Dossier | null>(null);

  // ── Queries ──
  const { data: clientsData } = useQuery({
    queryKey: clientsKeys.list({ q: debouncedClientSearch, limit: 8 }),
    queryFn: () =>
      clientsApi.list({ q: debouncedClientSearch || undefined, limit: 8 }),
    enabled: debouncedClientSearch.length > 0,
  });
  const clientResults = clientsData?.data ?? [];

  const { data: servicesData } = useQuery({
    queryKey: ["notary-services", "active"],
    queryFn: () => notaryServicesApi.list({ isActive: true, limit: 100 }),
    enabled: step === 2,
  });
  const services = servicesData?.data ?? [];

  const { data: notariesData } = useQuery({
    queryKey: ["notaries"],
    queryFn: () =>
      usersApi
        .getAll({ role: "notary_public", status: "active", limit: 100 })
        .then((r) => r.data),
    enabled: step === 3,
  });

  // Fetch linked template when service changes
  const { data: linkedTemplateData } = useQuery({
    queryKey: ["template-detail", selectedService?.linkedTemplateId],
    queryFn: () => templatesApi.getOne(selectedService!.linkedTemplateId!),
    enabled: !!(step === 2 && selectedService?.linkedTemplateId),
  });

  // linkedTemplateData from the query is used directly (no separate state needed)

  // ── Client search helpers ──
  function onClientSearchChange(val: string) {
    setClientSearch(val);
    setSelectedClient(null);
    setShowClientDropdown(true);
    if (clientSearchTimer.current) clearTimeout(clientSearchTimer.current);
    clientSearchTimer.current = setTimeout(() => {
      setDebouncedClientSearch(val);
    }, 300);
  }

  function selectClient(c: Client) {
    setSelectedClient(c);
    setClientSearch(`${c.firstName} ${c.lastName}`);
    setShowClientDropdown(false);
    setShowNewClientForm(false);
    setStep1Error("");
  }

  function setNCF<K extends keyof typeof newClientForm>(key: K, val: string) {
    setNewClientForm((f) => ({ ...f, [key]: val }));
  }

  const createClientMut = useMutation({
    mutationFn: (body: Parameters<typeof clientsApi.create>[0]) =>
      clientsApi.create(body),
  });

  // ── Step navigation ──
  async function goToStep2() {
    setStep1Error("");

    if (showNewClientForm) {
      const { firstName, lastName, nationalId } = newClientForm;
      if (!firstName.trim() || !lastName.trim()) {
        setStep1Error("First and last name are required.");
        return;
      }
      if (!/^\d{16}$/.test(nationalId)) {
        setStep1Error("National ID must be exactly 16 digits.");
        return;
      }

      let photoUrl: string | undefined;
      if (capturedDataUrl) {
        setUploadingPhoto(true);
        try {
          photoUrl = await uploadToCloudinary(capturedDataUrl);
        } catch {
          setStep1Error("Photo upload failed. Please try again.");
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      }

      try {
        const client = await createClientMut.mutateAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nationalId,
          phone: newClientForm.phone.trim() || undefined,
          photoUrl,
        });
        setSelectedClient(client);
      } catch (err) {
        setStep1Error(
          err instanceof ApiError ? err.message : "Failed to create client.",
        );
        return;
      }
    } else if (!selectedClient) {
      setStep1Error("Please select a client or register a new one.");
      return;
    }

    setStep(2);
  }

  function goToStep3() {
    setStep2Error("");
    if (!selectedService) {
      setStep2Error("Please select a service.");
      return;
    }
    if (linkedTemplateData) {
      const missing = (linkedTemplateData.fields ?? []).filter(
        (f: { key: string; label: string; required: boolean }) =>
          f.required && !filledFields[f.key]?.trim(),
      );
      if (missing.length > 0) {
        setStep2Error(
          `Please fill required fields: ${missing.map((f: { label: string }) => f.label).join(", ")}.`,
        );
        return;
      }
    }
    setStep(3);
  }

  const createDossierMut = useMutation({
    mutationFn: (body: CreateDossierBody) => dossiersApi.create(body),
    onSuccess: (dossier) => {
      success("Dossier created.");
      setCreatedDossier(dossier);
      onSaved();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create dossier.",
      ),
  });

  function handleCreate() {
    if (!selectedClient || !selectedService) return;
    setFormError("");
    createDossierMut.mutate({
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      serviceType: selectedService.name,
      notaryFee: notaryFee,
      assignedNotaryId: selectedNotaryId || undefined,
      description: description.trim() || undefined,
      templateFields:
        Object.keys(filledFields).length > 0 ? filledFields : undefined,
    });
  }

  const isPending =
    createDossierMut.isPending || createClientMut.isPending || uploadingPhoto;

  const totalFee = (selectedService?.officialFee ?? 0) + notaryFee;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => !isPending && onClose()}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FolderPlus size={16} />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              New Dossier
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

        <StepIndicator step={step} />

        {/* ── Post-creation state ── */}
        {createdDossier ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Dossier created!
              </p>
              <p className="text-sm text-muted mt-1">
                #{createdDossier.number}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              {selectedService?.linkedTemplateId &&
                linkedTemplateData?.content && (
                  <Button
                    size="sm"
                    leftIcon={<Printer size={14} />}
                    onClick={() =>
                      printDocument(
                        linkedTemplateData,
                        filledFields,
                        selectedClient!,
                        selectedService,
                        notaryFee,
                      )
                    }
                  >
                    Print Document
                  </Button>
                )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Step 1: Client ── */}
            {step === 1 && (
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Step 1 of 3 — Client
                </p>

                {/* Client search */}
                {!selectedClient && !showNewClientForm && (
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-sm font-medium text-foreground">
                      Search Client <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                        <Search size={15} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search by name or National ID…"
                        value={clientSearch}
                        onChange={(e) => onClientSearchChange(e.target.value)}
                        onFocus={() =>
                          clientSearch.length > 0 && setShowClientDropdown(true)
                        }
                        className={cn(
                          "w-full h-10 rounded-md border border-border bg-white pl-9 pr-3 text-sm text-foreground",
                          "placeholder:text-muted",
                          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                        )}
                      />
                    </div>
                    {showClientDropdown &&
                      debouncedClientSearch.length > 0 &&
                      clientResults.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-border rounded-md shadow-lg px-4 py-3 text-sm text-muted text-center">
                          No client found — register them below
                        </div>
                      )}
                    {showClientDropdown && clientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                        {clientResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface text-left transition-colors"
                            onClick={() => selectClient(c)}
                          >
                            <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                              {c.photoUrl ? (
                                <Image
                                  src={c.photoUrl}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-brand-600">
                                  {clientInitials(c)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-xs text-muted font-mono">
                                {c.nationalId}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected client card */}
                {selectedClient && !showNewClientForm && (
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-green-300 bg-green-100 flex items-center justify-center">
                      {selectedClient.photoUrl ? (
                        <Image
                          src={selectedClient.photoUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-green-700">
                          {clientInitials(selectedClient)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                      <p className="text-xs text-green-600 font-mono">
                        {selectedClient.nationalId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                      <button
                        type="button"
                        className="text-xs text-green-700 underline hover:no-underline"
                        onClick={() => {
                          setSelectedClient(null);
                          setClientSearch("");
                          setDebouncedClientSearch("");
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {/* Register new client toggle */}
                {!selectedClient && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<UserPlus size={14} />}
                    onClick={() => {
                      setShowNewClientForm((v) => !v);
                      setClientSearch("");
                      setDebouncedClientSearch("");
                      setShowClientDropdown(false);
                    }}
                  >
                    {showNewClientForm
                      ? "Cancel registration"
                      : "Register new client"}
                  </Button>
                )}

                {/* New client inline form */}
                {showNewClientForm && !selectedClient && (
                  <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                      New Client
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="First Name"
                        placeholder="Jean"
                        required
                        value={newClientForm.firstName}
                        onChange={(e) => setNCF("firstName", e.target.value)}
                      />
                      <Input
                        label="Last Name"
                        placeholder="Mugisha"
                        required
                        value={newClientForm.lastName}
                        onChange={(e) => setNCF("lastName", e.target.value)}
                      />
                    </div>
                    <Input
                      label="National ID"
                      placeholder="16-digit National ID"
                      required
                      inputMode="numeric"
                      maxLength={16}
                      value={newClientForm.nationalId}
                      onChange={(e) =>
                        setNCF(
                          "nationalId",
                          e.target.value.replace(/\D/g, "").slice(0, 16),
                        )
                      }
                      hint={`${newClientForm.nationalId.length}/16 digits`}
                    />
                    <Input
                      label="Phone"
                      placeholder="+250788000000"
                      value={newClientForm.phone}
                      onChange={(e) => setNCF("phone", e.target.value)}
                    />

                    {/* Webcam / photo */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">
                        Photo
                      </label>
                      {!showCamera ? (
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center">
                            {capturedDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={capturedDataUrl}
                                alt="Captured"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageOff size={20} className="text-muted" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              leftIcon={<Camera size={13} />}
                              onClick={() => setShowCamera(true)}
                            >
                              {capturedDataUrl ? "Retake" : "Open Camera"}
                            </Button>
                            {capturedDataUrl && (
                              <p className="text-xs text-green-600">
                                Photo captured
                              </p>
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
                  </div>
                )}

                {step1Error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                    {step1Error}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Service & Fees ── */}
            {step === 2 && (
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Step 2 of 3 — Service &amp; Fees
                </p>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Select Service <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(svc);
                          setStep2Error("");
                        }}
                        className={cn(
                          "flex items-start gap-3 w-full rounded-lg border px-4 py-3 text-left transition-all",
                          selectedService?.id === svc.id
                            ? "border-brand-500 ring-2 ring-brand-200 bg-brand-50"
                            : "border-border hover:border-brand-300 hover:bg-surface",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {svc.name}
                          </p>
                          {svc.description && (
                            <p className="text-xs text-muted mt-0.5 line-clamp-2">
                              {svc.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {formatFee(svc.officialFee)} official
                        </span>
                      </button>
                    ))}
                    {services.length === 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
                        No active services yet. Ask the Admin to create services
                        first.
                      </div>
                    )}
                  </div>
                </div>

                {selectedService && (
                  <>
                    <div className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Official Fee</span>
                        <span className="font-semibold text-foreground">
                          {formatFee(selectedService.officialFee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="notary-fee"
                          className="text-sm text-muted"
                        >
                          Notary Fee (RWF)
                        </label>
                        <input
                          id="notary-fee"
                          type="number"
                          min={0}
                          value={notaryFee}
                          onChange={(e) =>
                            setNotaryFee(Math.max(0, Number(e.target.value)))
                          }
                          className={cn(
                            "w-32 h-8 rounded-md border border-border bg-white px-2 text-sm text-right text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                          )}
                        />
                      </div>
                      <div className="border-t border-border pt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Total
                        </span>
                        <span className="text-base font-bold text-brand-600">
                          {formatFee(totalFee)}
                        </span>
                      </div>
                    </div>

                    {/* Template fields */}
                    {linkedTemplateData &&
                      (linkedTemplateData.fields ?? []).length > 0 && (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                            Document Fields — {linkedTemplateData.name}
                          </p>
                          {(linkedTemplateData.fields ?? []).map((field) => (
                            <div
                              key={field.key}
                              className="flex flex-col gap-1"
                            >
                              <label className="text-sm font-medium text-foreground">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-0.5">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                placeholder={field.label}
                                value={filledFields[field.key] ?? ""}
                                onChange={(e) =>
                                  setFilledFields((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className={cn(
                                  "w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground",
                                  "placeholder:text-muted",
                                  "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                )}

                {step2Error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                    {step2Error}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Step 3 of 3 — Review
                </p>

                {/* Summary card */}
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* Client */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                      Client
                    </p>
                    {selectedClient && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                          {selectedClient.photoUrl ? (
                            <Image
                              src={selectedClient.photoUrl}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-brand-600">
                              {clientInitials(selectedClient)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {selectedClient.firstName} {selectedClient.lastName}
                          </p>
                          <p className="text-xs text-muted font-mono">
                            {selectedClient.nationalId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service & fees */}
                  {selectedService && (
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                        Service
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedService.name}
                      </p>
                      <div className="mt-2 flex flex-col gap-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted">Official Fee</span>
                          <span>{formatFee(selectedService.officialFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Notary Fee</span>
                          <span>{formatFee(notaryFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-brand-600 border-t border-border pt-1 mt-1">
                          <span>Total</span>
                          <span className="text-base">
                            {formatFee(totalFee)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Template field values */}
                  {linkedTemplateData &&
                    (linkedTemplateData.fields ?? []).length > 0 && (
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                          Document Fields
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {(linkedTemplateData.fields ?? []).map((f) => (
                            <div
                              key={f.key}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-muted">{f.label}</span>
                              <span className="text-foreground font-medium text-right max-w-xs truncate">
                                {filledFields[f.key] || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Assigned Notary */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">
                    Assigned Notary
                  </label>
                  <select
                    value={selectedNotaryId}
                    onChange={(e) => setSelectedNotaryId(e.target.value)}
                    className={cn(
                      "w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                      "transition-shadow duration-150 cursor-pointer",
                    )}
                  >
                    <option value="">— Unassigned —</option>
                    {(notariesData ?? []).map((n: UserRow) => (
                      <option key={n.id} value={n.id}>
                        {n.firstName} {n.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the dossier…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={cn(
                      "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground",
                      "placeholder:text-muted resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                      "transition-shadow duration-150",
                    )}
                  />
                </div>

                {formError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                    {formError}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-border">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  leftIcon={<ChevronLeft size={14} />}
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  disabled={isPending}
                >
                  Back
                </Button>
              )}
              {step === 1 && (
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
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  loading={isPending}
                  rightIcon={<ChevronRight size={14} />}
                  onClick={step === 1 ? goToStep2 : goToStep3}
                  disabled={
                    step === 1
                      ? !selectedClient && !showNewClientForm
                      : !selectedService
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  loading={isPending}
                  onClick={handleCreate}
                >
                  Create Dossier
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DossiersPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeStatus, setActiveStatus] = useState<DossierStatus | "all">(
    "all",
  );

  const [showPanel, setShowPanel] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dossier | null>(null);
  const isAdmin = typeof window !== "undefined" ? getIsAdmin() : false;

  const queryParams = {
    q: debouncedSearch || undefined,
    status: activeStatus === "all" ? undefined : activeStatus,
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: dossiersKeys.list(queryParams),
    queryFn: () => dossiersApi.list(queryParams),
  });

  const dossiers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const deleteMut = useMutation({
    mutationFn: (id: string) => dossiersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dossiersKeys.lists() });
      success("Dossier deleted.");
      setDeleteTarget(null);
    },
    onError: (err) =>
      toastError(
        err instanceof ApiError ? err.message : "Failed to delete dossier.",
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
    qc.invalidateQueries({ queryKey: dossiersKeys.lists() });
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Dossiers" />

        <main className="flex-1 p-5 sm:p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Dossiers
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isLoading
                  ? "Loading…"
                  : `${total} ${total === 1 ? "dossier" : "dossiers"} total`}
              </p>
            </div>
            <Button
              size="sm"
              leftIcon={<FolderPlus size={14} />}
              onClick={() => setShowPanel(true)}
            >
              New Dossier
            </Button>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setActiveStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeStatus === tab.value
                    ? "bg-brand-500 text-white"
                    : "bg-surface text-muted hover:text-foreground hover:bg-gray-100",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-5 max-w-sm">
            <Input
              placeholder="Search by number or client name…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              leftElement={<Search size={15} />}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>#Number</TableTh>
                <TableTh>Client</TableTh>
                <TableTh className="hidden md:table-cell">Service</TableTh>
                <TableTh className="hidden lg:table-cell">
                  Assigned Notary
                </TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="hidden sm:table-cell">Created</TableTh>
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
              ) : dossiers.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={7} className="p-0">
                    <EmptyState
                      icon={FolderOpen}
                      title={
                        debouncedSearch || activeStatus !== "all"
                          ? "No dossiers match your filters"
                          : "No dossiers yet"
                      }
                      description={
                        debouncedSearch || activeStatus !== "all"
                          ? "Try a different search or filter."
                          : "Create the first dossier to get started."
                      }
                      action={
                        !debouncedSearch && activeStatus === "all" ? (
                          <Button
                            size="sm"
                            leftIcon={<FolderPlus size={14} />}
                            onClick={() => setShowPanel(true)}
                          >
                            New Dossier
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableTd>
                </TableRow>
              ) : (
                dossiers.map((d) => (
                  <TableRow key={d.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {d.number}
                    </TableTd>

                    <TableTd>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                          {d.client.photoUrl ? (
                            <Image
                              src={d.client.photoUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-brand-600">
                              {d.client.firstName[0]}
                              {d.client.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {d.client.firstName} {d.client.lastName}
                          </p>
                          <p className="text-xs text-muted font-mono truncate">
                            {d.client.nationalId}
                          </p>
                        </div>
                      </div>
                    </TableTd>

                    <TableTd className="hidden md:table-cell text-xs text-muted">
                      {d.serviceName ?? d.serviceType ?? "—"}
                    </TableTd>

                    <TableTd className="hidden lg:table-cell text-xs text-muted">
                      {d.assignedNotary
                        ? `${d.assignedNotary.firstName} ${d.assignedNotary.lastName}`
                        : "—"}
                    </TableTd>

                    <TableTd>
                      <StatusBadge status={d.status} />
                    </TableTd>

                    <TableTd className="hidden sm:table-cell text-xs text-muted">
                      {formatDate(d.createdAt)}
                    </TableTd>

                    <TableTd>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/dossiers/${d.id}`}
                          title="View dossier"
                          className="p-1.5 rounded cursor-pointer text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        {isAdmin && (
                          <button
                            type="button"
                            title="Delete dossier"
                            onClick={() => setDeleteTarget(d)}
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

      {/* New Dossier wizard panel */}
      {showPanel && (
        <NewDossierPanel
          onClose={() => setShowPanel(false)}
          onSaved={afterSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => !deleteMut.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete this dossier?"
        description={
          deleteTarget && (
            <>
              Dossier{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.number}
              </span>{" "}
              will be permanently removed. This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete dossier"
        tone="danger"
        loading={deleteMut.isPending}
      />
    </>
  );
}
