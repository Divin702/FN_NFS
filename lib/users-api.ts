import { api } from "./api";

export type Role = "citizen" | "legal_clerk" | "notary_public" | "administrator";
export type UserStatus = "active" | "inactive" | "disabled" | "pending";

export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nationalId: string;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
  isDisabled: boolean;
  invitationAccepted: boolean;
  invitationExpiresAt?: string;
  lastActiveAt?: string;
  createdAt: string;
  organization?: string;
  picture?: string;
}

export interface UsersResponse {
  data: UserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersParams {
  search?: string;
  role?: Role | "";
  status?: UserStatus | "";
  page?: number;
  limit?: number;
}

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersParams) => [...usersKeys.lists(), params] as const,
};

function buildQs(params: UsersParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.role) q.set("role", params.role);
  if (params.status) q.set("status", params.status);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const usersApi = {
  getAll: (params: UsersParams = {}) =>
    api.get<UsersResponse>(`/users${buildQs(params)}`),
  disable: (id: string) =>
    api.patch<{ message: string }>(`/users/${id}/disable`),
  enable: (id: string) =>
    api.patch<{ message: string }>(`/users/${id}/enable`),
  resendInvitation: (id: string) =>
    api.patch<{ message: string }>(`/users/${id}/resend-invitation`),
};
