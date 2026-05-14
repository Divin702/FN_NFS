import { apiClient } from "./api";

export interface NotaryService {
  id: string;
  name: string;
  description: string | null;
  officialFee: number; // RWF
  linkedTemplateId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface NotaryServicesResponse {
  data: NotaryService[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateNotaryServiceBody {
  name: string;
  description?: string;
  officialFee: number;
  linkedTemplateId?: string | null;
  isActive?: boolean;
}

export interface UpdateNotaryServiceBody {
  name?: string;
  description?: string;
  officialFee?: number;
  linkedTemplateId?: string | null;
  isActive?: boolean;
}

export const notaryServicesApi = {
  list: (params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
    q?: string;
  }) =>
    apiClient
      .get<NotaryServicesResponse, { data: NotaryServicesResponse }>(
        "/notary-services",
        { params }
      )
      .then((r) => r.data),

  get: (id: string) =>
    apiClient
      .get<NotaryService, { data: NotaryService }>(`/notary-services/${id}`)
      .then((r) => r.data),

  create: (body: CreateNotaryServiceBody) =>
    apiClient
      .post<NotaryService, { data: NotaryService }>("/notary-services", body)
      .then((r) => r.data),

  update: (id: string, body: UpdateNotaryServiceBody) =>
    apiClient
      .patch<NotaryService, { data: NotaryService }>(
        `/notary-services/${id}`,
        body
      )
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient
      .delete<unknown, { data: unknown }>(`/notary-services/${id}`)
      .then((r) => r.data),
};

export const notaryServicesKeys = {
  all: ["notary-services"] as const,
  lists: () => [...notaryServicesKeys.all, "list"] as const,
  list: (params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
    q?: string;
  }) => [...notaryServicesKeys.lists(), params] as const,
  detail: (id: string) =>
    [...notaryServicesKeys.all, "detail", id] as const,
};
