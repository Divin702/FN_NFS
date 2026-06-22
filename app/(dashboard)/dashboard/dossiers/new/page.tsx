"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Camera,
  ImageOff,
  CheckCircle2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  dossiersApi,
  type Dossier,
  type CreateDossierBody,
} from "@/lib/dossiers-api";
import {
  clientsApi,
  clientsKeys,
  fingerprintAgent,
  type Client,
} from "@/lib/clients-api";
import { getToken, getUser } from "@/lib/auth";
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
import { WebcamCapture } from "@/components/dashboard/WebcamCapture";
import { IDScanner } from "@/components/ui/IDScanner";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { cn } from "@/lib/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFee(n: number) {
  return n.toLocaleString("en-RW") + " RWF";
}

function clientInitials(c: { firstName: string; lastName: string }) {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

export async function uploadToCloudinary(dataUrl: string): Promise<string> {
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

export function printDocument(
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
  const steps = [
    { label: "Service", num: 1 },
    { label: "Parties", num: 2 },
    { label: "Review", num: 3 },
  ] as const;

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((s, idx) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm",
                step === s.num
                  ? "bg-brand-500 text-white ring-4 ring-brand-100"
                  : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-muted border border-border",
              )}
            >
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span
              className={cn(
                "text-[10px] sm:text-xs font-semibold",
                step === s.num
                  ? "text-brand-600"
                  : step > s.num
                    ? "text-emerald-600"
                    : "text-muted",
              )}
            >
              {s.label}
            </span>
          </div>
          {idx < 2 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2 sm:mx-3 mb-5 rounded",
                step > s.num ? "bg-emerald-400" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Party Slot Types ─────────────────────────────────────────────────────────

interface PartySlot {
  roleKey: string;
  roleLabel: string;
  required: boolean;
  client: Client | null;
  showNewForm: boolean;
  newForm: {
    firstName: string;
    lastName: string;
    nationalId: string;
    phone: string;
  };
  capturedDataUrl: string | null;
  showCamera: boolean;
  searchText: string;
  debouncedSearch: string;
  showDropdown: boolean;
  signatureUrl: string;
}

function makeDefaultSlot(
  roleKey: string,
  roleLabel: string,
  required: boolean,
): PartySlot {
  return {
    roleKey,
    roleLabel,
    required,
    client: null,
    showNewForm: false,
    newForm: { firstName: "", lastName: "", nationalId: "", phone: "" },
    capturedDataUrl: null,
    showCamera: false,
    searchText: "",
    debouncedSearch: "",
    showDropdown: false,
    signatureUrl: "",
  };
}

// ─── Party Slot Section ───────────────────────────────────────────────────────

interface PartySlotSectionProps {
  slot: PartySlot;
  slotIndex: number;
  onUpdate: (index: number, patch: Partial<PartySlot>) => void;
  onClientCreated: (index: number, client: Client) => void;
  createClientMut: ReturnType<
    typeof useMutation<Client, Error, Parameters<typeof clientsApi.create>[0]>
  >;
  skipped: boolean;
  onToggleSkip: (index: number) => void;
}

function PartySlotSection({
  slot,
  slotIndex,
  onUpdate,
  onClientCreated,
  createClientMut,
  skipped,
  onToggleSkip,
}: PartySlotSectionProps) {
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [slotError, setSlotError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [fpScanning, setFpScanning] = useState(false);
  const [fpError, setFpError] = useState("");

  async function handleSignature(dataUrl: string) {
    setUploadingSig(true);
    try {
      const url = await uploadToCloudinary(dataUrl);
      onUpdate(slotIndex, { signatureUrl: url });
    } catch {
      setSlotError("Signature upload failed. Please try again.");
    } finally {
      setUploadingSig(false);
    }
  }

  async function handleFingerprintScan() {
    const token = getToken();
    if (!token) {
      setFpError("Not authenticated.");
      return;
    }
    setFpScanning(true);
    setFpError("");
    try {
      const result = await fingerprintAgent.identify(
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
        token,
        20000,
      );
      if (result.matched && result.clientId) {
        const client = await clientsApi.getOne(result.clientId);
        selectClient(client);
      } else {
        setFpError("No matching client found.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFpError(
        msg.includes("9000")
          ? "Fingerprint agent not running on localhost:9000."
          : msg || "Scan failed.",
      );
    } finally {
      setFpScanning(false);
    }
  }

  const { data: searchData } = useQuery({
    queryKey: clientsKeys.list({ q: slot.debouncedSearch, limit: 8 }),
    queryFn: () =>
      clientsApi.list({ q: slot.debouncedSearch || undefined, limit: 8 }),
    enabled: slot.debouncedSearch.length > 0,
  });
  const searchResults = searchData?.data ?? [];

  function onSearchChange(val: string) {
    onUpdate(slotIndex, { searchText: val, showDropdown: true, client: null });
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onUpdate(slotIndex, { debouncedSearch: val });
    }, 300);
  }

  function selectClient(c: Client) {
    onUpdate(slotIndex, {
      client: c,
      searchText: `${c.firstName} ${c.lastName}`,
      showDropdown: false,
      showNewForm: false,
    });
    setSlotError("");
  }

  function setNF<K extends keyof PartySlot["newForm"]>(key: K, val: string) {
    onUpdate(slotIndex, { newForm: { ...slot.newForm, [key]: val } });
  }

  async function registerAndSelect() {
    setSlotError("");
    const { firstName, lastName, nationalId } = slot.newForm;
    if (!firstName.trim() || !lastName.trim()) {
      setSlotError("First and last name are required.");
      return;
    }
    if (!/^\d{16}$/.test(nationalId)) {
      setSlotError("National ID must be exactly 16 digits.");
      return;
    }

    let photoUrl: string | undefined;
    if (slot.capturedDataUrl) {
      setUploadingPhoto(true);
      try {
        photoUrl = await uploadToCloudinary(slot.capturedDataUrl);
      } catch {
        setSlotError("Photo upload failed. Please try again.");
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
        phone: slot.newForm.phone.trim() || undefined,
        photoUrl,
      });
      onClientCreated(slotIndex, client);
      setSlotError("");
    } catch (err) {
      setSlotError(
        err instanceof ApiError ? err.message : "Failed to create client.",
      );
    }
  }

  const isPending = uploadingPhoto || createClientMut.isPending;

  if (skipped) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{slot.roleLabel}</p>
          <p className="text-xs text-muted mt-0.5">Skipped (optional)</p>
        </div>
        <button
          type="button"
          className="text-xs text-brand-600 underline hover:no-underline shrink-0"
          onClick={() => onToggleSkip(slotIndex)}
        >
          Undo skip
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {slot.roleLabel}
          {slot.required && <span className="text-red-500 ml-0.5">*</span>}
        </p>
        {!slot.required && !slot.client && (
          <button
            type="button"
            className="text-xs text-muted underline hover:text-foreground shrink-0"
            onClick={() => onToggleSkip(slotIndex)}
          >
            Skip (optional)
          </button>
        )}
      </div>

      {/* Selected client card */}
      {slot.client && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-emerald-300 bg-emerald-100 flex items-center justify-center">
            {slot.client.photoUrl ? (
              <Image
                src={slot.client.photoUrl}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-emerald-700">
                {clientInitials(slot.client)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">
              {slot.client.firstName} {slot.client.lastName}
            </p>
            <p className="text-xs text-emerald-600 font-mono">
              {slot.client.nationalId}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-emerald-700 underline hover:no-underline"
            onClick={() =>
              onUpdate(slotIndex, {
                client: null,
                signatureUrl: "",
                searchText: "",
                debouncedSearch: "",
                showDropdown: false,
                showNewForm: false,
              })
            }
          >
            Change
          </button>
        </div>
      )}

      {/* Party signature — captured once a client is selected */}
      {slot.client && (
        <div className="rounded-lg border border-border bg-surface p-3">
          {uploadingSig ? (
            <div className="flex items-center gap-2 text-xs text-brand-600 py-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
              Saving signature…
            </div>
          ) : (
            <SignaturePad
              label={`${slot.roleLabel} signature`}
              value={slot.signatureUrl || undefined}
              onChange={handleSignature}
              onClear={() => onUpdate(slotIndex, { signatureUrl: "" })}
            />
          )}
        </div>
      )}

      {/* Search input */}
      {!slot.client && !slot.showNewForm && (
        <div className="relative">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name or National ID…"
              value={slot.searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() =>
                slot.searchText.length > 0 &&
                onUpdate(slotIndex, { showDropdown: true })
              }
              className={cn(
                "w-full h-10 rounded-md border border-border bg-white pl-9 pr-3 text-sm text-foreground",
                "placeholder:text-muted",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
              )}
            />
          </div>
          {slot.showDropdown &&
            slot.debouncedSearch.length > 0 &&
            searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-border rounded-md shadow-lg px-4 py-3 text-sm text-muted text-center">
                No client found — register them below
              </div>
            )}
          {slot.showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((c) => (
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

      {/* Fingerprint + register actions */}
      {!slot.client && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={fpScanning ? undefined : <Fingerprint size={14} />}
            loading={fpScanning}
            disabled={fpScanning}
            onClick={handleFingerprintScan}
          >
            {fpScanning ? "Scanning..." : "Scan Fingerprint"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<UserPlus size={14} />}
            onClick={() => {
              onUpdate(slotIndex, {
                showNewForm: !slot.showNewForm,
                searchText: "",
                debouncedSearch: "",
                showDropdown: false,
              });
            }}
          >
            {slot.showNewForm ? "Cancel registration" : "Register new client"}
          </Button>
        </div>
      )}

      {fpError && <p className="text-xs text-red-500">{fpError}</p>}

      {/* New client inline form */}
      {slot.showNewForm && !slot.client && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
            New Client
          </p>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Jean"
              required
              value={slot.newForm.firstName}
              onChange={(e) => setNF("firstName", e.target.value)}
            />
            <Input
              label="Last Name"
              placeholder="Mugisha"
              required
              value={slot.newForm.lastName}
              onChange={(e) => setNF("lastName", e.target.value)}
            />
          </div>
          <Input
            label="National ID"
            placeholder="16-digit National ID"
            required
            inputMode="numeric"
            maxLength={16}
            value={slot.newForm.nationalId}
            onChange={(e) =>
              setNF(
                "nationalId",
                e.target.value.replace(/\D/g, "").slice(0, 16),
              )
            }
            hint={`${slot.newForm.nationalId.length}/16 digits`}
          />
          <IDScanner
            label="Or scan ID card photo"
            onScanned={({ nationalId }) => setNF("nationalId", nationalId)}
          />
          <Input
            label="Phone"
            placeholder="+250788000000"
            value={slot.newForm.phone}
            onChange={(e) => setNF("phone", e.target.value)}
          />

          {/* Webcam / photo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Photo</label>
            {!slot.showCamera ? (
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center">
                  {slot.capturedDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.capturedDataUrl}
                      alt="Captured"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff size={18} className="text-muted" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Camera size={13} />}
                    onClick={() => onUpdate(slotIndex, { showCamera: true })}
                  >
                    {slot.capturedDataUrl ? "Retake" : "Open Camera"}
                  </Button>
                  {slot.capturedDataUrl && (
                    <p className="text-xs text-emerald-600">Photo captured</p>
                  )}
                </div>
              </div>
            ) : (
              <WebcamCapture
                onCapture={(dataUrl) => {
                  onUpdate(slotIndex, {
                    capturedDataUrl: dataUrl,
                    showCamera: false,
                  });
                }}
                onCancel={() => onUpdate(slotIndex, { showCamera: false })}
              />
            )}
          </div>

          <Button
            type="button"
            size="sm"
            loading={isPending}
            onClick={registerAndSelect}
          >
            Register &amp; Select
          </Button>
        </div>
      )}

      {slotError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          {slotError}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewDossierPage() {
  const { success } = useToast();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === "administrator";

  // ── Step state ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1: Service ──
  const [selectedService, setSelectedService] = useState<NotaryService | null>(
    null,
  );
  const [step1Error, setStep1Error] = useState("");

  // ── Step 2: Parties & Fees ──
  const [partySlots, setPartySlots] = useState<PartySlot[]>([
    makeDefaultSlot("primary", "Primary Client", true),
  ]);
  const [skippedSlots, setSkippedSlots] = useState<Set<number>>(new Set());
  const [notaryFee, setNotaryFee] = useState(0);
  const [step2Error, setStep2Error] = useState("");

  // ── Step 3: Review & Create ──
  const [filledFields, setFilledFields] = useState<Record<string, string>>({});
  // Notary Public auto-assigns themselves; Admin picks from dropdown
  const [selectedNotaryId, setSelectedNotaryId] = useState(() =>
    currentUser?.role === "notary_public" ? currentUser.id : "",
  );
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  // ── Post-creation state ──
  const [createdDossier, setCreatedDossier] = useState<Dossier | null>(null);

  // ── Queries ──
  const { data: servicesData } = useQuery({
    queryKey: ["notary-services", "active"],
    queryFn: () => notaryServicesApi.list({ isActive: true, limit: 100 }),
    enabled: step === 1,
  });
  const services = servicesData?.data ?? [];

  const { data: linkedTemplateData, isFetching: templateFetching } = useQuery({
    queryKey: ["template-detail", selectedService?.linkedTemplateId],
    queryFn: () => templatesApi.getOne(selectedService!.linkedTemplateId!),
    enabled: !!selectedService?.linkedTemplateId,
  });

  const { data: notariesData } = useQuery({
    queryKey: ["notaries"],
    queryFn: () =>
      usersApi
        .getAll({ role: "notary_public", status: "active", limit: 100 })
        .then((r) => r.data),
    enabled: step === 3 && isAdmin,
  });

  // ── Helpers ──
  const createClientMut = useMutation({
    mutationFn: (body: Parameters<typeof clientsApi.create>[0]) =>
      clientsApi.create(body),
  });

  const updateSlot = useCallback((index: number, patch: Partial<PartySlot>) => {
    setPartySlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const handleClientCreated = useCallback((index: number, client: Client) => {
    setPartySlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        client,
        showNewForm: false,
        searchText: `${client.firstName} ${client.lastName}`,
        showDropdown: false,
      };
      return next;
    });
  }, []);

  const handleToggleSkip = useCallback((index: number) => {
    setSkippedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        // clear any assigned client when skipping
        setPartySlots((ps) => {
          const arr = [...ps];
          arr[index] = {
            ...arr[index],
            client: null,
            searchText: "",
            debouncedSearch: "",
            showDropdown: false,
            showNewForm: false,
          };
          return arr;
        });
      }
      return next;
    });
  }, []);

  function onSelectService(svc: NotaryService) {
    setSelectedService(svc);
    setStep1Error("");
  }

  function goToStep2() {
    setStep1Error("");
    if (!selectedService) {
      setStep1Error("Please select a service.");
      return;
    }
    const roles = linkedTemplateData?.partyRoles;
    if (roles && roles.length > 0) {
      setPartySlots(
        roles.map((r) => makeDefaultSlot(r.key, r.label, r.required)),
      );
    } else {
      setPartySlots([makeDefaultSlot("primary", "Primary Client", true)]);
    }
    setSkippedSlots(new Set());
    setStep(2);
  }

  function goToStep3() {
    setStep2Error("");
    const missingRequired = partySlots.filter((s) => s.required && !s.client);
    if (missingRequired.length > 0) {
      const names = missingRequired.map((s) => s.roleLabel);
      setStep2Error(
        names.length === 1
          ? `Please search for or scan a client fingerprint to fill the "${names[0]}" slot before continuing.`
          : `Please fill the following required slots before continuing: ${names.join(", ")}.`,
      );
      return;
    }

    // Auto-fill template fields with known data so the notary doesn't retype them
    if (linkedTemplateData?.fields?.length) {
      const primary = partySlots.find((s) => s.required && s.client)?.client;
      const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const notaryFullName =
        `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim();

      // Map every common key pattern → its value
      const autoMap: Record<string, string> = {
        // Full name
        clientName: primary ? `${primary.firstName} ${primary.lastName}` : "",
        client_name: primary ? `${primary.firstName} ${primary.lastName}` : "",
        fullName: primary ? `${primary.firstName} ${primary.lastName}` : "",
        full_name: primary ? `${primary.firstName} ${primary.lastName}` : "",
        nom_complet: primary ? `${primary.firstName} ${primary.lastName}` : "",
        // First / last
        firstName: primary?.firstName ?? "",
        first_name: primary?.firstName ?? "",
        prenom: primary?.firstName ?? "",
        lastName: primary?.lastName ?? "",
        last_name: primary?.lastName ?? "",
        nom: primary?.lastName ?? "",
        // Identity
        nationalId: primary?.nationalId ?? "",
        national_id: primary?.nationalId ?? "",
        nid: primary?.nationalId ?? "",
        cni: primary?.nationalId ?? "",
        cin: primary?.nationalId ?? "",
        // Contact
        phone: primary?.phone ?? "",
        telephone: primary?.phone ?? "",
        phoneNumber: primary?.phone ?? "",
        email: primary?.email ?? "",
        // Date
        date: today,
        today: today,
        dateToday: today,
        currentDate: today,
        year: String(new Date().getFullYear()),
        // Service
        service: selectedService?.name ?? "",
        serviceName: selectedService?.name ?? "",
        service_name: selectedService?.name ?? "",
        // Notary
        notary: notaryFullName,
        notaryName: notaryFullName,
        notary_name: notaryFullName,
        notaryPublic: notaryFullName,
      };

      setFilledFields((prev) => {
        const next = { ...prev };
        for (const field of linkedTemplateData.fields ?? []) {
          // Only auto-fill if not already manually filled
          if (!next[field.key] && autoMap[field.key]) {
            next[field.key] = autoMap[field.key];
          }
        }
        return next;
      });
    }

    setStep(3);
  }

  const createDossierMut = useMutation({
    mutationFn: (body: CreateDossierBody) => dossiersApi.create(body),
    onSuccess: (dossier) => {
      success("Dossier created.");
      setCreatedDossier(dossier);
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create dossier.",
      ),
  });

  function handleCreate() {
    if (!selectedService) return;
    const primarySlot = partySlots.find((s) => s.client);
    if (!primarySlot?.client) return;
    setFormError("");

    // Validate required template fields
    if (linkedTemplateData?.fields && linkedTemplateData.fields.length > 0) {
      const missingFields = linkedTemplateData.fields.filter(
        (f) => f.required && !filledFields[f.key]?.trim(),
      );
      if (missingFields.length > 0) {
        setFormError(
          `Please fill in required fields: ${missingFields.map((f) => f.label).join(", ")}.`,
        );
        return;
      }
    }

    const parties = partySlots
      .filter((s) => s.client)
      .map((s, i) => ({
        clientId: s.client!.id,
        roleKey: s.roleKey,
        roleLabel: s.roleLabel,
        isPrimary: i === 0,
        ...(s.signatureUrl ? { signatureUrl: s.signatureUrl } : {}),
      }));

    createDossierMut.mutate({
      clientId: primarySlot.client.id,
      serviceId: selectedService.id,
      serviceType: selectedService.name,
      notaryFee: notaryFee,
      assignedNotaryId: selectedNotaryId || undefined,
      description: description.trim() || undefined,
      templateFields:
        Object.keys(filledFields).length > 0 ? filledFields : undefined,
      parties,
      ...(currentUser?.signature
        ? { notarySignatureUrl: currentUser.signature }
        : {}),
    });
  }

  const isPending = createDossierMut.isPending || createClientMut.isPending;
  const totalFee = (selectedService?.officialFee ?? 0) + notaryFee;
  const primaryClient = partySlots.find((s) => s.client)?.client ?? null;

  // ── Success state ──
  if (createdDossier) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="New Dossier" />
        <div className="flex-1 overflow-y-auto bg-surface flex flex-col items-center justify-center px-3 sm:px-4 py-12 sm:py-16">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-10 flex flex-col items-center gap-5 sm:gap-6 text-center max-w-sm w-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                Dossier Created!
              </p>
              <p className="text-sm text-muted mt-1 font-mono">
                #{createdDossier.number}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {selectedService?.linkedTemplateId &&
                linkedTemplateData?.content &&
                primaryClient && (
                  <Button
                    leftIcon={<Printer size={14} />}
                    onClick={() =>
                      printDocument(
                        linkedTemplateData,
                        filledFields,
                        primaryClient,
                        selectedService,
                        notaryFee,
                      )
                    }
                  >
                    Print Document
                  </Button>
                )}
              <Link href={`/dashboard/dossiers/${createdDossier.id}`}>
                <Button variant="secondary" className="w-full">
                  View Dossier
                </Button>
              </Link>
              <Link href="/dashboard/dossiers/new">
                <Button variant="outline" className="w-full">
                  New Dossier
                </Button>
              </Link>
            </div>

            <Link
              href="/dashboard/dossiers"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Back to Dossiers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="New Dossier" />

      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 sm:space-y-6">
          {/* Back link */}
          <Link
            href="/dashboard/dossiers"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
            Dossiers
          </Link>

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">New Dossier</h1>
            <p className="text-sm text-muted mt-1">
              Follow the steps to create a new notary dossier.
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} />

          {/* Step content */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6 space-y-5">
            {/* ── Step 1: Service Selection ── */}
            {step === 1 && (
              <>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Step 1 of 3 — Select a Service
                </p>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Service <span className="text-red-500">*</span>
                    </label>
                    {services.length > 0 && (
                      <span className="text-xs text-muted">
                        {services.length} available
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-0.5">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => onSelectService(svc)}
                        className={cn(
                          "flex flex-col gap-1.5 w-full rounded-lg border px-4 py-4 text-left transition-all",
                          selectedService?.id === svc.id
                            ? "border-brand-500 ring-2 ring-brand-200 bg-brand-50"
                            : "border-border hover:border-brand-300 hover:bg-surface",
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {svc.name}
                        </p>
                        {svc.description && (
                          <p className="text-xs text-muted line-clamp-2">
                            {svc.description}
                          </p>
                        )}
                        <span className="mt-1 self-start text-xs font-medium text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {formatFee(svc.officialFee)} official
                        </span>
                      </button>
                    ))}
                    {services.length === 0 && (
                      <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
                        No active services yet. Ask the Admin to create services
                        first.
                      </div>
                    )}
                  </div>
                </div>

                {step1Error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                    {step1Error}
                  </div>
                )}
              </>
            )}

            {/* ── Step 2: Parties & Fees ── */}
            {step === 2 && (
              <>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Step 2 of 3 — Parties &amp; Fees
                </p>

                {/* Party slots */}
                <div className="flex flex-col gap-4">
                  {partySlots.map((slot, i) => (
                    <PartySlotSection
                      key={slot.roleKey}
                      slot={slot}
                      slotIndex={i}
                      onUpdate={updateSlot}
                      onClientCreated={handleClientCreated}
                      createClientMut={createClientMut}
                      skipped={skippedSlots.has(i)}
                      onToggleSkip={handleToggleSkip}
                    />
                  ))}
                </div>

                {/* Fees */}
                {selectedService && (
                  <div className="rounded-lg border border-border bg-surface px-5 py-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                      Fees
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Official Fee</span>
                      <span className="font-semibold text-foreground">
                        {formatFee(selectedService.officialFee)}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
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
                          "w-full xs:w-36 h-9 rounded-md border border-border bg-white px-2 text-sm xs:text-right text-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                        )}
                      />
                    </div>
                    <div className="border-t border-border pt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        Total
                      </span>
                      <span className="text-lg font-bold text-brand-600">
                        {formatFee(totalFee)}
                      </span>
                    </div>
                  </div>
                )}

                {step2Error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                    {step2Error}
                  </div>
                )}
              </>
            )}

            {/* ── Step 3: Review & Create ── */}
            {step === 3 && (
              <>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Step 3 of 3 — Review &amp; Create
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left: parties + service/fees summary */}
                  <div className="flex flex-col gap-4">
                    {/* Parties summary */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-3 bg-surface border-b border-border">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                          Parties
                        </p>
                      </div>
                      <div className="px-4 py-3 flex flex-col gap-3">
                        {partySlots
                          .filter((s) => s.client)
                          .map((s) => (
                            <div
                              key={s.roleKey}
                              className="flex items-center gap-3"
                            >
                              <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-border bg-brand-100 flex items-center justify-center">
                                {s.client!.photoUrl ? (
                                  <Image
                                    src={s.client!.photoUrl}
                                    alt=""
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-brand-600">
                                    {clientInitials(s.client!)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {s.client!.firstName} {s.client!.lastName}
                                </p>
                                <p className="text-xs text-muted font-mono">
                                  {s.client!.nationalId}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                                {s.roleLabel}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Service & fees summary */}
                    {selectedService && (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="px-4 py-3 bg-surface border-b border-border">
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                            Service &amp; Fees
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground mb-2">
                            {selectedService.name}
                          </p>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted">Official Fee</span>
                              <span>
                                {formatFee(selectedService.officialFee)}
                              </span>
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
                      </div>
                    )}
                  </div>

                  {/* Right: template fields + notary + description */}
                  <div className="flex flex-col gap-4">
                    {/* Template fields */}
                    {selectedService?.linkedTemplateId ? (
                      templateFetching ? (
                        <div className="rounded-lg border border-border p-4 animate-pulse space-y-2">
                          <div className="h-3 w-32 bg-surface rounded" />
                          <div className="h-9 w-full bg-surface rounded" />
                          <div className="h-9 w-full bg-surface rounded" />
                        </div>
                      ) : linkedTemplateData &&
                        (linkedTemplateData.fields ?? []).length > 0 ? (
                        <div className="rounded-lg border border-brand-200 bg-brand-50/30 overflow-hidden">
                          <div className="px-4 py-3 bg-brand-50 border-b border-brand-200 flex items-center justify-between">
                            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                              Document Fields
                            </p>
                            <p className="text-xs text-brand-500">
                              {linkedTemplateData.name}
                            </p>
                          </div>
                          <div className="px-4 py-4 flex flex-col gap-3">
                            {(linkedTemplateData.fields ?? []).map((field) => (
                              <div
                                key={field.key}
                                className="flex flex-col gap-1"
                              >
                                <label className="text-sm font-medium text-foreground">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-0.5">
                                      *
                                    </span>
                                  )}
                                </label>
                                <input
                                  type="text"
                                  placeholder={`Enter ${field.label.toLowerCase()}…`}
                                  value={filledFields[field.key] ?? ""}
                                  onChange={(e) =>
                                    setFilledFields((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                  className={cn(
                                    "w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground",
                                    "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
                          This service&apos;s template has no fillable fields.
                        </div>
                      )
                    ) : (
                      <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
                        No document template linked to this service.
                      </div>
                    )}

                    {/* Assigned Notary — only admins pick; notaries are auto-assigned */}
                    {isAdmin ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Assigned Notary
                        </label>
                        <select
                          value={selectedNotaryId}
                          onChange={(e) => setSelectedNotaryId(e.target.value)}
                          className={cn(
                            "w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer",
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
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Assigned Notary
                        </label>
                        <div className="h-10 rounded-md border border-border bg-surface px-3 flex items-center text-sm text-foreground">
                          {currentUser?.firstName} {currentUser?.lastName}{" "}
                          <span className="ml-1.5 text-xs text-muted">
                            (you)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Description
                      </label>
                      <textarea
                        placeholder="Brief description of the dossier…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className={cn(
                          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground",
                          "placeholder:text-muted resize-none",
                          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                          "transition-shadow duration-150",
                        )}
                      />
                    </div>

                    {/* Notary signature confirmation */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-3 bg-surface border-b border-border">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                          Your Signature
                        </p>
                      </div>
                      {currentUser?.signature ? (
                        <div className="px-4 py-3 flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentUser.signature}
                            alt="Your signature"
                            className="h-12 w-28 object-contain bg-white rounded-lg border border-border"
                          />
                          <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span>This signature will be stamped on the dossier.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-3 flex items-start gap-2.5 bg-amber-50">
                          <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">
                              No signature saved on your profile.
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              The dossier will be created without your signature.{" "}
                              <Link
                                href="/dashboard/profile/signature"
                                target="_blank"
                                className="font-semibold underline hover:no-underline"
                              >
                                Set up your signature
                              </Link>{" "}
                              first to stamp it.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                    {formError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between gap-3">
            <div>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<ChevronLeft size={14} />}
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  disabled={isPending}
                >
                  Back
                </Button>
              ) : (
                <Link href="/dashboard/dossiers">
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </Link>
              )}
            </div>

            <div>
              {step < 3 ? (
                <Button
                  type="button"
                  loading={isPending || (step === 1 && templateFetching)}
                  rightIcon={<ChevronRight size={14} />}
                  onClick={step === 1 ? goToStep2 : goToStep3}
                  disabled={
                    step === 1 ? !selectedService || templateFetching : false
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  loading={isPending}
                  onClick={handleCreate}
                >
                  Create Dossier
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
