import { loadToken } from "../state/authStore";

// iOS sim: http://localhost:5000
// Android emulator: http://10.0.2.2:5000
const BASE_URL = "http://localhost:5051"; // <— change to your dotnet run port

async function headers() {
  const h: Record<string,string> = { "Content-Type": "application/json" };
  const token = await loadToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function apiGet<T>(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: await headers() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}
export async function apiPost<T>(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers: await headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}
export async function apiPatch<T>(path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "PATCH", headers: await headers(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}