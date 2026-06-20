"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  CalendarClock, Calendar, Clock, MapPin,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Check,
} from "lucide-react";
import {
  appointmentsApi, appointmentKeys,
  APPT_STATUS_COLORS, APPT_STATUS_LABELS,
  type Appointment, type AppointmentStatus,
} from "@/lib/appointments-api";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { DocumentList } from "@/components/ui/DocumentLink";
import { appointmentSteps } from "@/lib/status-steps";
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

function AppointmentRow({ appt }: { appt: Appointment }) {
  const [open, setOpen]   = useState(false);
  const [notes, setNotes] = useState(appt.notaryNotes ?? "");
  const qc = useQueryClient();

  const { mutate: update, isPending } = useMutation({
    mutationFn: (data: { status?: AppointmentStatus; notaryNotes?: string }) =>
      appointmentsApi.update(appt.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.lists() }),
  });

  const dateStr = new Date(appt.requestedDate).toLocaleDateString("en-RW", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          <CalendarClock size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{appt.purpose}</p>
          <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
            <Calendar size={10} /> {dateStr} at {appt.requestedTime}
            {appt.client && (
              <> · <span className="font-medium">{appt.client.firstName} {appt.client.lastName}</span></>
            )}
          </p>
        </div>
        <StatusBadge status={appt.status} />
        <span className="ml-2 text-muted shrink-0">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">

          {/* Status journey */}
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <StatusStepper steps={appointmentSteps(appt)} />
          </div>

          {/* Client info */}
          {appt.client && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-surface border-b border-border">
                <p className="text-xs font-semibold text-foreground">Client</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  { label: "Name",  value: `${appt.client.firstName} ${appt.client.lastName}` },
                  { label: "Phone", value: appt.client.phoneNumber ?? "—" },
                  { label: "Email", value: appt.client.email ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white px-4 py-3">
                    <p className="text-[10px] text-muted font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date / time / location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted mb-0.5">Date &amp; Time</p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                <Clock size={11} className="text-muted" /> {appt.requestedTime}
              </p>
              <p className="text-xs text-muted mt-0.5">{dateStr}</p>
            </div>
            {appt.location && (
              <div>
                <p className="text-xs text-muted mb-0.5">Location</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <MapPin size={11} className="text-muted" /> {appt.location}
                </p>
              </div>
            )}
          </div>

          {appt.clientNotes && (
            <div>
              <p className="text-xs text-muted mb-1">Client notes</p>
              <p className="text-sm text-foreground leading-relaxed">{appt.clientNotes}</p>
            </div>
          )}

          {appt.documentUrls && appt.documentUrls.length > 0 && (
            <DocumentList urls={appt.documentUrls} label="Client's Documents" />
          )}

          {/* Notes to client */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted font-medium">Notes to client</label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder="Add a note for the client…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none transition"
              />
              <button
                type="button"
                onClick={() => update({ notaryNotes: notes })}
                disabled={isPending || notes === appt.notaryNotes}
                title="Save notes"
                className="h-10 w-10 self-start rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 transition-colors shrink-0"
              >
                <Check size={15} />
              </button>
            </div>
          </div>

          {/* Actions */}
          {appt.status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ status: "confirmed" })}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50 transition-colors border border-blue-100"
              >
                <CheckCircle2 size={13} /> Confirm
              </button>
              <button
                type="button"
                onClick={() => update({ status: "declined" })}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-100"
              >
                <XCircle size={13} /> Decline
              </button>
            </div>
          )}

          {appt.status === "confirmed" && (
            <button
              type="button"
              onClick={() => update({ status: "completed" })}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors border border-emerald-100"
            >
              <CheckCircle2 size={13} /> Mark as Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotaryAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");

  const { data: appointments, isLoading } = useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn:  appointmentsApi.list,
  });

  const filtered =
    filter === "all"
      ? (appointments ?? [])
      : (appointments ?? []).filter((a) => a.status === filter);

  const pending = appointments?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Appointments" />

      <main className="flex-1 overflow-auto p-5 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div>
            <p className="text-sm text-muted">
              {appointments?.length ?? 0} total
              {pending > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {pending} pending
                </span>
              )}
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
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-white border border-border text-muted hover:border-brand-500/30 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-18 rounded-2xl bg-white border border-border animate-pulse" />
              ))}
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center py-16 text-center bg-white rounded-2xl border border-border">
              <div className="h-14 w-14 rounded-xl bg-surface flex items-center justify-center mb-3">
                <CalendarClock size={24} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {filter === "all" ? "No appointments yet" : `No ${filter} appointments`}
              </p>
              <p className="text-xs text-muted mt-1">
                Clients book appointments from the portal
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <AppointmentRow key={a.id} appt={a} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
