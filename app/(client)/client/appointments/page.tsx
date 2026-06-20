"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock, Calendar, Clock, MapPin,
  ChevronDown, ChevronUp, Trash2, CheckCircle2,
} from "lucide-react";
import {
  appointmentsApi, appointmentKeys,
  APPT_STATUS_COLORS, APPT_STATUS_LABELS,
  type Appointment, type AppointmentStatus,
} from "@/lib/appointments-api";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/cn";

const FILTERS: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "All",       value: "all"       },
  { label: "Pending",   value: "pending"   },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Declined",  value: "declined"  },
];

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const c = APPT_STATUS_COLORS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.bg, c.text)}>
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
    weekday: "short", day: "numeric", month: "long", year: "numeric",
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
          <p className="text-sm font-semibold text-gray-900 truncate">{appt.purpose}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Calendar size={10} />
            {dateStr} at {appt.requestedTime}
            {appt.notary && (
              <> · <span className="font-medium">{appt.notary.firstName} {appt.notary.lastName}</span></>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Notary</p>
              <p className="text-sm font-medium text-gray-800">
                {appt.notary?.firstName} {appt.notary?.lastName}
              </p>
              {appt.notary?.organization && (
                <p className="text-xs text-gray-400">{appt.notary.organization}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Date &amp; Time</p>
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                <Clock size={11} className="text-gray-400" /> {appt.requestedTime}
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
          </div>

          {appt.clientNotes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Your Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{appt.clientNotes}</p>
            </div>
          )}

          {appt.notaryNotes && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Note from notary</p>
              <p className="text-sm text-blue-800 leading-relaxed">{appt.notaryNotes}</p>
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
            on <span className="font-semibold text-gray-700">{dateStr}</span> will be cancelled.
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
    queryFn:  appointmentsApi.list,
    refetchInterval: 15_000,
  });

  const filtered =
    filter === "all"
      ? (appointments ?? [])
      : (appointments ?? []).filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {appointments?.length ?? 0} total appointments
        </p>
      </div>

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
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#103060]/30 hover:text-[#103060]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-18 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-16 text-center bg-white rounded-2xl border border-gray-100">
          <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <CalendarClock size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {filter === "all" ? "No appointments yet" : `No ${filter} appointments`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "all"
              ? "Go to Find Notary and book a physical appointment"
              : "Change the filter to see other appointments"}
          </p>
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
