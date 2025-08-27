// src/api/auth.ts
import { apiPost } from "./client";
import { saveToken } from "../state/authStore";
import type { AuthResponse } from "../types/dto";

export async function register(username: string, email: string, password: string) {
  const res = await apiPost<AuthResponse>("/auth/register", { username, email, password });
  await saveToken(res.token);
  return res;
}

export async function login(usernameOrEmail: string, password: string) {
  const res = await apiPost<AuthResponse>("/auth/login", { usernameOrEmail, password });
  await saveToken(res.token);
  return res;
}