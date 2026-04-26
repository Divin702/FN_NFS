const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message ?? "Something went wrong";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>("POST", path, body, token),
  get: <T>(path: string, token?: string) =>
    request<T>("GET", path, undefined, token),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>("PATCH", path, body, token),
};
