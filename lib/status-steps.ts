import type { StepItem } from "@/components/ui/StatusStepper";
import type { NotarizationRequest } from "@/lib/requests-api";
import type { Appointment } from "@/lib/appointments-api";
import { relativeTime } from "@/lib/time";

/** Stepper items for a notarization request: Submitted → Accepted → Completed (or Declined). */
export function requestSteps(req: NotarizationRequest): StepItem[] {
  const submitted: StepItem = {
    label: "Submitted",
    sub: relativeTime(req.createdAt),
    state: "done",
  };
  if (req.status === "declined") {
    return [
      submitted,
      { label: "Declined", sub: relativeTime(req.updatedAt), state: "declined" },
    ];
  }
  const accepted = req.status === "accepted" || req.status === "completed";
  const completed = req.status === "completed";
  return [
    submitted,
    {
      label: "Accepted",
      sub: accepted ? relativeTime(req.updatedAt) : "Awaiting review",
      state: accepted ? "done" : "current",
    },
    {
      label: "Completed",
      sub: completed ? relativeTime(req.updatedAt) : "—",
      state: completed ? "done" : "upcoming",
    },
  ];
}

/** Stepper items for an appointment: Requested → Confirmed → Completed (or Declined / Cancelled). */
export function appointmentSteps(appt: Appointment): StepItem[] {
  const requested: StepItem = {
    label: "Requested",
    sub: relativeTime(appt.createdAt),
    state: "done",
  };
  if (appt.status === "declined") {
    return [
      requested,
      { label: "Declined", sub: relativeTime(appt.updatedAt), state: "declined" },
    ];
  }
  if (appt.status === "cancelled") {
    return [
      requested,
      { label: "Cancelled", sub: relativeTime(appt.updatedAt), state: "cancelled" },
    ];
  }
  const confirmed = appt.status === "confirmed" || appt.status === "completed";
  const completed = appt.status === "completed";
  return [
    requested,
    {
      label: "Confirmed",
      sub: confirmed ? relativeTime(appt.updatedAt) : "Awaiting confirmation",
      state: confirmed ? "done" : "current",
    },
    {
      label: "Completed",
      sub: completed ? relativeTime(appt.updatedAt) : "—",
      state: completed ? "done" : "upcoming",
    },
  ];
}
