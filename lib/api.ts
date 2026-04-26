import axios, { AxiosError } from "axios";
import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap the { success, data, ... } envelope from the response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps success responses: { success: true, data: T, ... }
    if (response.data && response.data.success === true && "data" in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: AxiosError<{ message?: string | string[]; error?: string; statusCode?: number }>) => {
    const data = error.response?.data;
    let message = "Something went wrong. Please try again.";

    if (data?.message) {
      message = Array.isArray(data.message)
        ? data.message.join("; ")
        : data.message;
    } else if (error.message === "Network Error") {
      message = "Cannot reach the server. Check your connection.";
    }

    // Attach clean message so callers only need err.message
    return Promise.reject(new ApiError(message, error.response?.status ?? 0, data?.error));
  }
);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorType?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  get: <T>(path: string) =>
    apiClient.get<T, { data: T }>(path).then((r) => r.data),

  post: <T>(path: string, body?: unknown) =>
    apiClient.post<T, { data: T }>(path, body).then((r) => r.data),

  patch: <T>(path: string, body?: unknown) =>
    apiClient.patch<T, { data: T }>(path, body).then((r) => r.data),

  delete: <T>(path: string) =>
    apiClient.delete<T, { data: T }>(path).then((r) => r.data),
};
