import { API_BASE_URL } from "./env";
import type { ApiResponse } from "./types";

const AUTH_TOKEN_KEY = "wikistock_access_token";

export function getAccessToken() {
  return typeof window === "undefined"
    ? null
    : sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAccessToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

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

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  // Chỉ chuyển trang khi phiên hiện tại hết hạn; lỗi đăng nhập vẫn được trả về form.
  if (response.status === 401 && token) {
    clearAccessToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  return response;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);

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
