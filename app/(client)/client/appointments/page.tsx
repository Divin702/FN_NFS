"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Building2,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  Send,
} from "lucide-react";
import {
  appointmentsApi,
  appointmentKeys,
  APPT_STATUS_COLORS,
  APPT_STATUS_LABELS,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments-api";
import { requestsApi } from "@/lib/requests-api";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { RichSelect } from "@/components/ui/RichSelect";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { DocumentList } from "@/components/ui/DocumentLink";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { appointmentSteps } from "@/lib/status-steps";
import { fmtDateTime, relativeTime } from "@/lib/time";
import { cn } from "@/lib/cn";

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

// ── Book Appointment Modal (pick a notary, then schedule) ─────────────────────
function BookAppointmentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [notaryId, setNotaryId] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [location, setLocation] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [documentUrls, setDocumentUrls] = useState<string[]>([""]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data: notaries } = useQuery({
    queryKey: ["users", "notaries"],
    queryFn: requestsApi.listNotaries,
  });

  const notaryOptions = (notaries ?? []).map((n) => ({
    value: n.id,
    label: `${n.firstName} ${n.lastName}`,
    description: n.organization || n.email,
    avatarUrl: n.picture,
  }));

  function setDoc(index: number, url: string) {
    setDocumentUrls((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        notaryId,
        requestedDate,
        requestedTime,
        purpose,
        ...(location ? { location } : {}),
        ...(clientNotes ? { clientNotes } : {}),
        documentUrls: documentUrls.filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
      setSuccess(true);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Booking failed"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!notaryId) return setError("Please select a notary.");
    if (!requestedDate || !requestedTime)
      return setError("Please choose a date and time.");
    mutate();
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            Book an Appointment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors rounded-lg p-1"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Appointment requested!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                The notary will confirm your visit shortly.
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <RichSelect
              label="Notary"
              required
              searchable
              placeholder="Choose a notary"
              value={notaryId}
              onChange={setNotaryId}
              options={notaryOptions}
              emptyText="No notaries available"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Purpose
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sign a sale agreement"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="appt-date"
                  className="text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  id="appt-date"
                  type="date"
                  required
                  min={today}
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
                />
              </div>
              <Select
                label="Time"
                required
                placeholder="Select time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="h-11 rounded-xl"
                options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Location{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Notary office or preferred location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Notes{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Anything the notary should know…"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#103060]/30 focus:border-[#103060] transition resize-none"
              />
            </div>

            {/* Documents to bring / share */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Documents{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-col gap-2">
                {documentUrls.map((url, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1">
                      <DocumentUpload
                        value={url}
                        onChange={(u) => setDoc(i, u)}
                        onRemove={() => setDoc(i, "")}
                        folder="nfs/appointments/client"
                        label={
                          i === 0 ? "Upload document" : `Document ${i + 1}`
                        }
                      />
                    </div>
                    {documentUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDocumentUrls((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        className="mt-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {documentUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => setDocumentUrls((p) => [...p, ""])}
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

            <button
              type="submit"
              disabled={isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#103060] text-white text-sm font-semibold hover:bg-[#0d2750] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isPending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Send size={14} /> Request Appointment
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const FILTERS: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Declined", value: "declined" },
];

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const c = APPT_STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {APPT_STATUS_LABELS[status]}
    </span>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const qc = useQueryClient();

  const { mutate: cancel, isPending } = useMutation({
    mutationFn: () => appointmentsApi.update(appt.id, { status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
      setConfirmOpen(false);
    },
  });

  const canCancel = appt.status === "pending" || appt.status === "confirmed";

  const dateStr = new Date(appt.requestedDate).toLocaleDateString("en-RW", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#103060]/5 text-[#103060]">
          <CalendarClock size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {appt.purpose}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Calendar size={10} />
            {dateStr} at {appt.requestedTime}
            {appt.notary && (
              <>
                {" "}
                ·{" "}
                <span className="font-medium">
                  {appt.notary.firstName} {appt.notary.lastName}
                </span>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={appt.status} />
        <span className="ml-2 text-gray-400 shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50 space-y-4 pt-4">
          {/* Status journey */}
          <div className="rounded-xl bg-gray-50/70 border border-gray-100 px-4 py-4">
            <StatusStepper steps={appointmentSteps(appt)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Notary</p>
              <p className="text-sm font-medium text-gray-800">
                {appt.notary?.firstName} {appt.notary?.lastName}
              </p>
              {appt.notary?.organization && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Building2 size={10} /> {appt.notary.organization}
                </p>
              )}
              {appt.notary?.email && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Mail size={10} /> {appt.notary.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Date &amp; Time</p>
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                <Clock size={11} className="text-gray-400" />{" "}
                {appt.requestedTime}
              </p>
              <p className="text-xs text-gray-400">{dateStr}</p>
            </div>
            {appt.location && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <MapPin size={11} className="text-gray-400" /> {appt.location}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Requested</p>
              <p className="text-sm font-medium text-gray-800">
                {relativeTime(appt.createdAt)}
              </p>
              <p className="text-xs text-gray-400">
                {fmtDateTime(appt.createdAt)}
              </p>
            </div>
            {appt.status !== "pending" && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  {appt.status === "confirmed"
                    ? "Confirmed"
                    : appt.status === "declined"
                      ? "Declined"
                      : appt.status === "completed"
                        ? "Completed"
                        : appt.status === "cancelled"
                          ? "Cancelled"
                          : "Updated"}
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {relativeTime(appt.updatedAt)}
                </p>
                <p className="text-xs text-gray-400">
                  {fmtDateTime(appt.updatedAt)}
                </p>
              </div>
            )}
          </div>

          {appt.clientNotes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Your Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {appt.clientNotes}
              </p>
            </div>
          )}

          {appt.documentUrls && appt.documentUrls.length > 0 && (
            <DocumentList urls={appt.documentUrls} label="Documents" />
          )}

          {appt.notaryNotes && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">
                Note from notary
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">
                {appt.notaryNotes}
              </p>
            </div>
          )}

          {appt.status === "confirmed" && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <p className="text-xs font-medium text-emerald-700">
                Your appointment is confirmed. Please arrive 5 minutes early.
              </p>
            </div>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={12} />
              {isPending ? "Cancelling…" : "Cancel appointment"}
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => cancel()}
        title="Cancel this appointment?"
        description={
          <>
            Your appointment for{" "}
            <span className="font-semibold text-gray-700">{appt.purpose}</span>{" "}
            on <span className="font-semibold text-gray-700">{dateStr}</span>{" "}
            will be cancelled.
          </>
        }
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        tone="danger"
        loading={isPending}
        icon={Trash2}
      />
    </div>
  );
}

export default function MyAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");

  const { data: appointments, isLoading } = useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: appointmentsApi.list,
    refetchInterval: 15_000,
  });

  const [booking, setBooking] = useState(false);

  const filtered =
    filter === "all"
      ? (appointments ?? [])
      : (appointments ?? []).filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {appointments?.length ?? 0} total appointments
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBooking(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#103060] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d2750] transition-colors cursor-pointer"
        >
          <Plus size={15} /> Book Appointment
        </button>
      </div>

      {booking && <BookAppointmentModal onClose={() => setBooking(false)} />}

      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === value
                ? "bg-[#103060] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#103060]/30 hover:text-[#103060]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-18 rounded-2xl bg-white border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-16 text-center bg-white rounded-2xl border border-gray-100">
          <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <CalendarClock size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {filter === "all"
              ? "No appointments yet"
              : `No ${filter} appointments`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "all"
              ? "Book a physical appointment with a notary"
              : "Change the filter to see other appointments"}
          </p>
          {filter === "all" && (
            <button
              type="button"
              onClick={() => setBooking(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#103060] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0d2750] transition-colors cursor-pointer"
            >
              <Plus size={13} /> Book Appointment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <AppointmentCard key={a.id} appt={a} />
          ))}
        </div>
      )}
    </div>
  );
}
