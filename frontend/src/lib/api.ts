import { API_BASE_URL } from "./env";
import type { ApiResponse } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly details?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add auth token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("Backend response is not valid JSON", response.status);
  }

  if (!response.ok || payload.error || (payload.statusCode && payload.statusCode >= 400)) {
    throw new ApiError(
      payload.message || "Backend request failed",
      payload.statusCode || response.status,
      payload.error?.details,
    );
  }

  return payload.data as T;
}

// GET request
export function apiGet<T>(path: string, init: RequestInit = {}) {
  return request<T>(path, {
    ...init,
    method: "GET",
  });
}

// POST request
export function apiPost<TResponse, TPayload = unknown>(
  path: string,
  payload: TPayload,
  init: RequestInit = {},
) {
  return request<TResponse>(path, {
    ...init,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUT request
export function apiPut<TResponse, TPayload = unknown>(
  path: string,
  payload: TPayload,
  init: RequestInit = {},
) {
  return request<TResponse>(path, {
    ...init,
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// DELETE request
export function apiDelete<T>(path: string, init: RequestInit = {}) {
  return request<T>(path, {
    ...init,
    method: "DELETE",
  });
}
