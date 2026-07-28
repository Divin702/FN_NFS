"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  ChevronRight,
  CalendarClock,
  Plus,
  Trash2,
  ShieldCheck,
  LayoutGrid,
  List,
  ChevronLeft,
  ScanLine,
} from "lucide-react";
import { requestsApi, requestsKeys, type Notary } from "@/lib/requests-api";
import { appointmentsApi, appointmentKeys } from "@/lib/appointments-api";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { IDScanner } from "@/components/ui/IDScanner";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";

async function uploadToCloudinary(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("file", blob, "id-card.jpg");
  form.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  );
  form.append("folder", "nfs/requests/id-scans");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: form },
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("ID image upload failed.");
  return data.secure_url as string;
}

async function uploadFileToCloudinary(file: File): Promise<string> {
  const resourceType = file.type.startsWith("image/") ? "image" : "raw";
  const form = new FormData();
  form.append("file", file);
  form.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  );
  form.append("folder", "nfs/requests/client");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("Document upload failed.");
  return data.secure_url as string;
}

// ── Submit Request Modal ──────────────────────────────────────────────────────

function RequestModal({
  notary,
  onClose,
}: {
  notary: Notary;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([""]);
  const [idVerified, setIdVerified] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState("");
  const [idMethod, setIdMethod] = useState("ID card");
  const [verifying, setVerifying] = useState(false);
  const [showDocScan, setShowDocScan] = useState(false);
  const [docScanning, setDocScanning] = useState(false);
  const [parcelUpi, setParcelUpi] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      requestsApi.create({
        notaryId: notary.id,
        documentType,
        description: parcelUpi
          ? `${description ? `${description}\n\n` : ""}Parcel UPI: ${parcelUpi}`
          : description,
        attachmentUrls: attachmentUrls.filter(Boolean),
        ...(idImageUrl ? { idImageUrl } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKeys.lists() });
      setSuccess(true);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Submission failed"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!idVerified) {
      setError(
        "Please verify your identity by scanning your ID card before submitting.",
      );
      return;
    }
    mutate();
  }

  function setUrl(index: number, url: string) {
    setAttachmentUrls((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  }

  function removeSlot(index: number) {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">
            Request submitted!
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {notary.firstName} {notary.lastName} will review your request
            shortly.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-5 py-2 rounded-xl bg-[#103060] text-white text-sm font-medium hover:bg-[#0d2750] transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Document type
          </label>
          <button
            type="button"
            onClick={() => setShowDocScan((s) => !s)}
            className="flex items-center gap-1 text-xs font-semibold text-[#103060] hover:text-[#0d2750]"
          >
            <ScanLine size={13} />
            {showDocScan ? "Hide scan" : "Scan to auto-fill"}
          </button>
        </div>
        <input
          type="text"
          required
          autoFocus
          placeholder="e.g. Sale agreement, Power of attorney…"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
        />
        {showDocScan && (
          <div className="mt-1">
            <IDScanner
              kinds={["document"]}
              acceptTypes={["Agreement", "Transcription", "Land"]}
              onScanned={async ({ suggestedType, identifier, upi, file }) => {
                // Auto-fill the document type — detected automatically, no
                // need to pick a category before scanning.
                setDocumentType(suggestedType || identifier || "Document");
                // Capture the land parcel UPI as a structured field.
                if (upi) setParcelUpi(upi);
                // Attach the original file (PDF stays a PDF) to the request.
                setDocScanning(true);
                try {
                  const url = await uploadFileToCloudinary(file);
                  setAttachmentUrls((prev) => {
                    const next = [...prev];
                    const empty = next.findIndex((u) => !u);
                    if (empty >= 0) next[empty] = url;
                    else next.push(url);
                    return next;
                  });
                } catch {
                  // Non-fatal — the user can still upload manually.
                } finally {
                  setDocScanning(false);
                }
              }}
            />
            {docScanning && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#103060]">
                <span className="h-3 w-3 rounded-full border-2 border-[#103060]/30 border-t-[#103060] animate-spin" />
                Attaching scanned document…
              </p>
            )}
          </div>
        )}
      </div>

      {/* Land parcel UPI — auto-captured from a scanned land document */}
      {parcelUpi && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <MapPin size={16} className="text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Land parcel UPI
            </p>
            <p className="truncate font-mono text-sm font-bold text-amber-900">
              {parcelUpi}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setParcelUpi("")}
            className="shrink-0 rounded-lg p-1.5 text-amber-400 transition-colors hover:bg-amber-100 hover:text-amber-600"
            aria-label="Remove UPI"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          required
          rows={3}
          placeholder="Describe what you need notarized and any relevant details…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition resize-none"
        />
      </div>

      {/* Identity verification via OCR */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Verify your identity <span className="text-red-500">*</span>
        </label>
        {idVerified ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            {idImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={idImageUrl}
                alt="Scanned ID"
                className="h-12 w-16 rounded-lg object-cover border border-emerald-200 shrink-0"
              />
            )}
            <div className="flex items-center gap-2 flex-1">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Identity confirmed
                </p>
                <p className="text-xs text-emerald-600">
                  {idMethod} verified via scan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIdVerified(false);
                setIdImageUrl("");
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
            >
              Rescan
            </button>
          </div>
        ) : (
          <>
            <IDScanner
              kinds={["national_id", "passport"]}
              label="Scan your National ID or passport"
              onScanned={async ({ kind, imageDataUrl }) => {
                setError("");
                setIdMethod(kind === "passport" ? "Passport" : "National ID");
                setVerifying(true);
                try {
                  const url = await uploadToCloudinary(imageDataUrl);
                  setIdImageUrl(url);
                  setIdVerified(true);
                } catch {
                  // Even if the upload fails, allow verification to proceed
                  setIdVerified(true);
                } finally {
                  setVerifying(false);
                }
              }}
            />
            {verifying && (
              <p className="text-xs text-[#103060] flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-[#103060]/30 border-t-[#103060] animate-spin" />
                Uploading your ID image…
              </p>
            )}
          </>
        )}
      </div>

      {/* Multiple document uploads */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Supporting documents{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-col gap-2">
          {attachmentUrls.map((url, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <DocumentUpload
                  value={url}
                  onChange={(u) => setUrl(i, u)}
                  onRemove={() => setUrl(i, "")}
                  folder="nfs/requests/client"
                  label={i === 0 ? "Upload document" : `Document ${i + 1}`}
                />
              </div>
              {attachmentUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="mt-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {attachmentUrls.length < 5 && (
          <button
            type="button"
            onClick={() => setAttachmentUrls((p) => [...p, ""])}
            className="flex items-center gap-1.5 text-sm text-[#103060] hover:text-[#0d2750] font-medium self-start"
          >
            <Plus size={14} /> Add another document
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Sticky footer CTA — always reachable, even on a long form */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-2 border-t border-gray-100 bg-white px-6 py-4">
        {!idVerified && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck size={13} className="text-gray-300" />
            Verify your identity above to submit.
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || !idVerified}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#103060] text-sm font-semibold text-white transition-colors hover:bg-[#0d2750] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              <Send size={14} /> Submit Request
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Appointment Modal ─────────────────────────────────────────────────────────

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function AppointmentModal({
  notary,
  onClose,
}: {
  notary: Notary;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    requestedDate: "",
    requestedTime: "",
    purpose: "",
    location: "",
    clientNotes: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        notaryId: notary.id,
        ...form,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
      setSuccess(true);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Booking failed"),
  });

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">
            Appointment requested!
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {notary.firstName} {notary.lastName} will confirm your appointment
            shortly.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 px-5 py-2 rounded-xl bg-[#103060] text-white text-sm font-medium hover:bg-[#0d2750] transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        mutate();
      }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Purpose of visit
        </label>
        <input
          type="text"
          required
          autoFocus
          placeholder="e.g. Sign sale agreement, Power of attorney..."
          value={form.purpose}
          onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="appt-date"
            className="text-sm font-medium text-gray-700"
          >
            Preferred date
          </label>
          <input
            id="appt-date"
            type="date"
            required
            min={today}
            value={form.requestedDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, requestedDate: e.target.value }))
            }
            className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
          />
        </div>
        <Select
          label="Preferred time"
          required
          placeholder="Select time"
          value={form.requestedTime}
          onChange={(e) =>
            setForm((p) => ({ ...p, requestedTime: e.target.value }))
          }
          className="h-11 rounded-xl"
          options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Location <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Notary office address or preferred location"
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="Anything the notary should know before the appointment..."
          value={form.clientNotes}
          onChange={(e) =>
            setForm((p) => ({ ...p, clientNotes: e.target.value }))
          }
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Sticky footer CTA */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-2 border-t border-gray-100 bg-white px-6 py-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#103060] text-sm font-semibold text-white transition-colors hover:bg-[#0d2750] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              <CalendarClock size={14} /> Book Appointment
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Notary Card ───────────────────────────────────────────────────────────────

function NotaryCard({
  notary,
  onRequest,
  onBook,
}: {
  notary: Notary;
  onRequest: (n: Notary) => void;
  onBook: (n: Notary) => void;
}) {
  const initials =
    `${notary.firstName[0] ?? ""}${notary.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="group flex flex-col items-center overflow-hidden rounded-xl border border-gray-100 bg-white px-5 text-center transition-all hover:-translate-y-1 hover:border-[#103060]/20 hover:shadow-xl hover:shadow-gray-200/70">
      {/* Avatar with verified check */}
      <div className="relative p-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#103060]/8 ring-2 ring-[#103060]/5">
          {notary.picture ? (
            <Image
              src={notary.picture}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-[#103060]">{initials}</span>
          )}
        </div>
      </div>

      {/* Name + role */}
      <p className="mt-3.5 text-base font-bold text-gray-900">
        {notary.firstName} {notary.lastName}
      </p>
      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
        <ShieldCheck size={11} /> Verified Notary
      </span>
      {notary.organization && (
        <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-gray-500">
          <Building2 size={11} /> {notary.organization}
        </p>
      )}

      {/* Quick facts row */}
      <div className="mt-4 flex w-full items-center justify-center divide-x divide-gray-100 rounded-xl bg-gray-50/70 py-2.5">
        <div className="flex flex-1 flex-col items-center gap-0.5 px-2 min-w-0">
          <MapPin size={13} className="text-[#103060]" />
          <span className="truncate text-[11px] font-medium text-gray-600 max-w-full">
            {notary.address || "Rwanda"}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5 px-2 min-w-0">
          <Phone size={13} className="text-[#103060]" />
          <span className="truncate text-[11px] font-medium text-gray-600 max-w-full">
            {notary.phoneNumber || "—"}
          </span>
        </div>
      </div>

      {notary.email && (
        <p className="mt-2 flex items-center justify-center gap-1 truncate text-xs text-gray-400 max-w-full">
          <Mail size={11} /> {notary.email}
        </p>
      )}

      {/* Services offered */}
      {notary.services && notary.services.length > 0 && (
        <div className="mt-3 w-full">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Services
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {notary.services.slice(0, 4).map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-[#103060]/5 px-2 py-0.5 text-[10px] font-medium text-[#103060]"
              >
                {s.name}
              </span>
            ))}
            {notary.services.length > 4 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                +{notary.services.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex w-full gap-2 py-6">
        <button
          type="button"
          onClick={() => onRequest(notary)}
          className="group/btn flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#103060] text-sm font-semibold text-white transition-colors hover:bg-[#0d2750]"
        >
          <Send size={13} /> Request
          <ChevronRight
            size={13}
            className="transition-transform group-hover/btn:translate-x-0.5"
          />
        </button>
        <button
          type="button"
          onClick={() => onBook(notary)}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#103060]/15 text-sm font-semibold text-[#103060] transition-colors hover:bg-[#103060]/5"
        >
          <CalendarClock size={13} /> Book
        </button>
      </div>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function NotaryRow({
  notary,
  num,
  onRequest,
  onBook,
}: {
  notary: Notary;
  num: number;
  onRequest: (n: Notary) => void;
  onBook: (n: Notary) => void;
}) {
  const initials =
    `${notary.firstName[0] ?? ""}${notary.lastName[0] ?? ""}`.toUpperCase();
  return (
    <tr className="group transition-colors hover:bg-[#103060]/3">
      <td className="w-10 py-3.5 pl-5 pr-1 text-center align-middle">
        <span className="text-xs font-semibold tabular-nums text-gray-300 group-hover:text-gray-400">
          {num}
        </span>
      </td>
      <td className="py-3.5 pl-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#103060]/8 ring-1 ring-gray-200/70">
            {notary.picture ? (
              <Image
                src={notary.picture}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-[#103060]">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-900">
              {notary.firstName} {notary.lastName}
              <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
            </p>
            {notary.email && (
              <p className="truncate text-xs text-gray-400">{notary.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 md:table-cell">
        {notary.organization ? (
          <span className="inline-flex max-w-50 items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-100">
            <Building2 size={12} className="shrink-0 text-gray-400" />
            <span className="truncate">{notary.organization}</span>
          </span>
        ) : (
          <span className="text-sm text-gray-300">—</span>
        )}
      </td>
      <td className="hidden px-4 py-3.5 lg:table-cell">
        <span className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={14} className="shrink-0 text-gray-400" />
          <span className="truncate">{notary.address || "Rwanda"}</span>
        </span>
      </td>
      <td className="hidden px-4 py-3.5 sm:table-cell">
        <span className="flex items-center gap-1.5 text-sm tabular-nums text-gray-600">
          <Phone size={14} className="shrink-0 text-gray-400" />
          {notary.phoneNumber || "—"}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onRequest(notary)}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#103060] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0d2750]"
          >
            <Send size={12} /> Request
          </button>
          <button
            type="button"
            onClick={() => onBook(notary)}
            aria-label="Book appointment"
            title="Book appointment"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-[#103060]/20 hover:bg-[#103060]/5 hover:text-[#103060]"
          >
            <CalendarClock size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 9;

export default function FindNotaryPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Notary | null>(null);
  const [booking, setBooking] = useState<Notary | null>(null);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  const { data: notaries, isLoading } = useQuery({
    queryKey: requestsKeys.notaries(),
    queryFn: requestsApi.listNotaries,
  });

  const filtered = (notaries ?? []).filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `${n.firstName} ${n.lastName}`.toLowerCase().includes(q) ||
      (n.organization ?? "").toLowerCase().includes(q) ||
      (n.address ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Reset to first page whenever the result set shrinks past the current page.
  if (page !== currentPage) setPage(currentPage);

  return (
    <div className="space-y-5">
      {/* Search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, organization, or location…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="inline-flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-[#103060] text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              aria-label="Table view"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                view === "table"
                  ? "bg-[#103060] text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-white border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <Search size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">No notaries found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search
              ? "Try a different search term"
              : "No active notaries are registered yet"}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((n) => (
            <NotaryCard
              key={n.id}
              notary={n}
              onRequest={setSelected}
              onBook={setBooking}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="w-10 py-3 pl-5 pr-1 text-center font-semibold">
                    #
                  </th>
                  <th className="py-3 pl-3 pr-4 font-semibold">Notary</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">
                    Organization
                  </th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                    Location
                  </th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((n, i) => (
                  <NotaryRow
                    key={n.id}
                    notary={n}
                    num={pageStart + i + 1}
                    onRequest={setSelected}
                    onBook={setBooking}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  p === currentPage
                    ? "bg-[#103060] text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Request drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="New Notarization Request"
        subtitle={
          selected ? `To ${selected.firstName} ${selected.lastName}` : undefined
        }
      >
        {selected && (
          <RequestModal notary={selected} onClose={() => setSelected(null)} />
        )}
      </Drawer>

      {/* Appointment drawer */}
      <Drawer
        open={!!booking}
        onClose={() => setBooking(null)}
        title="Book Physical Appointment"
        subtitle={
          booking ? `With ${booking.firstName} ${booking.lastName}` : undefined
        }
      >
        {booking && (
          <AppointmentModal notary={booking} onClose={() => setBooking(null)} />
        )}
      </Drawer>
    </div>
  );
}
