import { apiClient } from "./api";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  fingerprintTemplate: string | null;
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

  getOne: (id: string) =>
    apiClient
      .get<Client, { data: Client }>(`/clients/${id}`)
      .then((r) => r.data),
};

export const clientsKeys = {
  all: ["clients"] as const,
  lists: () => [...clientsKeys.all, "list"] as const,
  list: (params: { q?: string; page?: number; limit?: number }) =>
    [...clientsKeys.lists(), params] as const,
  detail: (id: string) => [...clientsKeys.all, "detail", id] as const,
};

// ── Fingerprint agent (runs locally on Windows, port 9000) ──────────────────

const AGENT_URL = "http://localhost:9000";

export interface AgentStatus {
  ready: boolean;
  message: string;
}

export interface AgentCaptureResult {
  template: string;  // base64-encoded ARATEK template
  quality: number;   // 0–100; below 60 = poor scan
}

export interface AgentIdentifyResult {
  matched: boolean;
  clientId: string | null;
  score: number;
}

export const fingerprintAgent = {
  status: (): Promise<AgentStatus> =>
    fetch(`${AGENT_URL}/status`).then((r) => r.json()),

  // Capture only — used for enrollment
  capture: (timeoutMs = 15000): Promise<AgentCaptureResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(`${AGENT_URL}/capture`, {
      method: "POST",
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.error)));
        return r.json();
      })
      .finally(() => clearTimeout(timer));
  },

  // Capture + match against all stored templates — used for identification
  // The agent fetches templates from the backend and matches using the ARATEK SDK DLL.
  identify: (backendUrl: string, token: string, timeoutMs = 20000): Promise<AgentIdentifyResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(`${AGENT_URL}/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backendUrl, token }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.error)));
        return r.json();
      })
      .finally(() => clearTimeout(timer));
  },
};

// ── Backend fingerprint endpoints (enroll / remove only) ─────────────────────

export const fingerprintApi = {
  save: (clientId: string, template: string) =>
    apiClient
      .post<Client, { data: Client }>(`/clients/${clientId}/fingerprint`, {
        template,
      })
      .then((r) => r.data),

  remove: (clientId: string) =>
    apiClient
      .delete<Client, { data: Client }>(`/clients/${clientId}/fingerprint`)
      .then((r) => r.data),
};
