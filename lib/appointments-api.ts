import { api } from "./api";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export interface Appointment {
  id: string;
  clientId: string;
  notaryId: string;
  requestedDate: string;
  requestedTime: string;
  location?: string;
  purpose: string;
  clientNotes?: string;
  notaryNotes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; firstName: string; lastName: string; email: string; phoneNumber: string };
  notary?: { id: string; firstName: string; lastName: string; organization?: string };
}

export const appointmentsApi = {
  create: (data: {
    notaryId: string;
    requestedDate: string;
    requestedTime: string;
    purpose: string;
    location?: string;
    clientNotes?: string;
  }) => api.post<Appointment>("/appointments", data),

  list: () => api.get<Appointment[]>("/appointments"),

  update: (id: string, data: { status?: AppointmentStatus; notaryNotes?: string }) =>
    api.patch<Appointment>(`/appointments/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/appointments/${id}`),
};

export const appointmentKeys = {
  all:   ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
};

export const APPT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  declined:  "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const APPT_STATUS_COLORS: Record<
  AppointmentStatus,
  { bg: string; text: string; dot: string }
> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  confirmed: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  declined:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
  cancelled: { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400"    },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};
