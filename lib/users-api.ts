import { api } from "./api";
import { getToken } from "./auth";

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

export function getUsers(params: UsersParams): Promise<UsersResponse> {
  const q = new URLSearchParams();
  if (params.search)  q.set("search",  params.search);
  if (params.role)    q.set("role",    params.role);
  if (params.status)  q.set("status",  params.status);
  if (params.page)    q.set("page",    String(params.page));
  if (params.limit)   q.set("limit",   String(params.limit));
  const qs = q.toString();
  return api.get<UsersResponse>(`/users${qs ? `?${qs}` : ""}`, getToken() ?? undefined);
}

export function disableUser(id: string) {
  return api.patch<{ message: string }>(`/users/${id}/disable`, undefined, getToken() ?? undefined);
}

export function enableUser(id: string) {
  return api.patch<{ message: string }>(`/users/${id}/enable`, undefined, getToken() ?? undefined);
}

export function resendInvitation(id: string) {
  return api.patch<{ message: string }>(`/users/${id}/resend-invitation`, undefined, getToken() ?? undefined);
}
