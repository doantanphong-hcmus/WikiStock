import { apiGet, apiPost } from "@/lib/api";

export interface AuthUser {
  userId: number;
  email: string;
  fullName: string | null;
  role: {
    roleId: number;
    roleName: string;
  };
}

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export function register(payload: {
  fullName: string;
  email: string;
  password: string;
}) {
  return apiPost<AuthUser, typeof payload>("/auth/register", payload);
}

export function login(payload: { email: string; password: string }) {
  return apiPost<LoginResponse, typeof payload>("/auth/login", payload);
}

export function getCurrentUser() {
  return apiGet<AuthUser>("/auth/me");
}
