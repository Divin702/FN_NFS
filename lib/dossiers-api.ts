import { apiClient } from "./api";

export type DossierStatus = "open" | "in_progress" | "completed" | "archived";

export interface DossierDocument {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  changedById: string;
  changedByName: string;
}

export interface DossierParty {
  id: string;
  clientId: string;
  roleKey: string;
  roleLabel: string;
  isPrimary: boolean;
  signatureUrl: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    photoUrl: string | null;
  };
}

export interface Dossier {
  id: string;
  number: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    photoUrl: string | null;
  };
  parties: DossierParty[];
  assignedNotary: { id: string; firstName: string; lastName: string } | null;
  serviceType: string | null;
  serviceId: string | null;
  serviceName: string | null;
  officialFee: number | null;
  notaryFee: number | null;
  totalFee: number | null;
  notarySignatureUrl: string | null;
  status: DossierStatus;
  description: string | null;
  notes: string | null;
  templateFields: Record<string, string> | null;
  documents: DossierDocument[];
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DossiersResponse {
  data: Dossier[];
  total: number;
  page: number;
  limit: number;
}

export interface DossierStats {
  open: number;
  inProgress: number;
  completed: number;
  archived: number;
  total: number;
}

export interface CreateDossierBody {
  clientId: string;
  serviceType?: string;
  serviceId?: string;
  notaryFee?: number;
  templateFields?: Record<string, string>;
  assignedNotaryId?: string;
  description?: string;
  notarySignatureUrl?: string;
  parties?: {
    clientId: string;
    roleKey: string;
    roleLabel: string;
    isPrimary?: boolean;
    signatureUrl?: string;
  }[];
}

export interface UpdateDossierBody {
  serviceType?: string;
  assignedNotaryId?: string;
  description?: string;
  notes?: string;
}

export const dossiersApi = {
  list: (params?: {
    q?: string;
    status?: DossierStatus;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    apiClient
      .get<DossiersResponse, { data: DossiersResponse }>("/dossiers", { params })
      .then((r) => r.data),

  stats: (params?: { dateFrom?: string; dateTo?: string }) =>
    apiClient
      .get<DossierStats, { data: DossierStats }>("/dossiers/stats", { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient
      .get<Dossier, { data: Dossier }>(`/dossiers/${id}`)
      .then((r) => r.data),

  create: (body: CreateDossierBody) =>
    apiClient
      .post<Dossier, { data: Dossier }>("/dossiers", body)
      .then((r) => r.data),

  update: (id: string, body: UpdateDossierBody) =>
    apiClient
      .patch<Dossier, { data: Dossier }>(`/dossiers/${id}`, body)
      .then((r) => r.data),

  changeStatus: (id: string, status: DossierStatus) =>
    apiClient
      .patch<Dossier, { data: Dossier }>(`/dossiers/${id}/status`, { status })
      .then((r) => r.data),

  addDocument: (id: string, doc: { name: string; url: string }) =>
    apiClient
      .post<Dossier, { data: Dossier }>(`/dossiers/${id}/documents`, doc)
      .then((r) => r.data),

  removeDocument: (id: string, url: string) =>
    apiClient
      .delete<Dossier, { data: Dossier }>(`/dossiers/${id}/documents`, {
        data: { url },
      })
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient
      .delete<unknown, { data: unknown }>(`/dossiers/${id}`)
      .then((r) => r.data),
};

export const dossiersKeys = {
  all: ["dossiers"] as const,
  lists: () => [...dossiersKeys.all, "list"] as const,
  list: (params: {
    q?: string;
    status?: DossierStatus;
    page?: number;
    limit?: number;
  }) => [...dossiersKeys.lists(), params] as const,
  stats: (params?: { dateFrom?: string; dateTo?: string }) =>
    [...dossiersKeys.all, "stats", params ?? {}] as const,
  detail: (id: string) => [...dossiersKeys.all, "detail", id] as const,
};
