import { apiClient } from "./api";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface ClientsResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateClientBody {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface UpdateClientBody {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export const clientsApi = {
  list: (params?: { q?: string; page?: number; limit?: number }) =>
    apiClient
      .get<ClientsResponse, { data: ClientsResponse }>("/clients", { params })
      .then((r) => r.data),

  create: (body: CreateClientBody) =>
    apiClient
      .post<Client, { data: Client }>("/clients", body)
      .then((r) => r.data),

  update: (id: string, body: UpdateClientBody) =>
    apiClient
      .patch<Client, { data: Client }>(`/clients/${id}`, body)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient
      .delete<unknown, { data: unknown }>(`/clients/${id}`)
      .then((r) => r.data),
};

export const clientsKeys = {
  all: ["clients"] as const,
  lists: () => [...clientsKeys.all, "list"] as const,
  list: (params: { q?: string; page?: number; limit?: number }) =>
    [...clientsKeys.lists(), params] as const,
};
