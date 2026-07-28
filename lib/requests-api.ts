import { api } from "./api";

export type RequestStatus = "pending" | "accepted" | "declined" | "completed";

export interface NotarizationRequest {
  id: string;
  clientId: string;
  notaryId: string;
  documentType: string;
  description: string;
  attachmentUrls?: string[];
  idImageUrl?: string;
  status: RequestStatus;
  notaryNotes?: string;
  notaryDocumentUrl?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; firstName: string; lastName: string; email: string; phoneNumber: string; nationalId: string };
  notary?: { id: string; firstName: string; lastName: string; email: string; organization?: string };
}

export interface Notary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organization?: string;
  address?: string;
  picture?: string;
  signature?: string;
  services?: { id: string; name: string }[];
}

export const requestsApi = {
  listNotaries: () => api.get<Notary[]>("/users/notaries"),

  create: (data: {
    notaryId: string;
    documentType: string;
    description: string;
    attachmentUrls?: string[];
    idImageUrl?: string;
  }) => api.post<NotarizationRequest>("/requests", data),

  list: () => api.get<NotarizationRequest[]>("/requests"),

  get: (id: string) => api.get<NotarizationRequest>(`/requests/${id}`),

  update: (id: string, data: { status?: RequestStatus; notaryNotes?: string; notaryDocumentUrl?: string }) =>
    api.patch<NotarizationRequest>(`/requests/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/requests/${id}`),
};

export const requestsKeys = {
  all: ["requests"] as const,
  lists: () => [...requestsKeys.all, "list"] as const,
  detail: (id: string) => [...requestsKeys.all, id] as const,
  notaries: () => ["users", "notaries"] as const,
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export const STATUS_COLORS: Record<
  RequestStatus,
  { bg: string; text: string; dot: string }
> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  accepted:  { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  declined:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};
