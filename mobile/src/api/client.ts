// src/api/client.ts
import axios, { AxiosRequestConfig } from "axios";

// NOTE: axios.defaults.baseURL and Authorization are set in AuthContext.
// We just pass through the AbortSignal that React Query gives us.

export async function apiGet<T>(url: string, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.get<T>(url, { signal: cfg?.signal, ...cfg });
  return data;
}

export async function apiPost<T>(url: string, body: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.post<T>(url, body, { signal: cfg?.signal, ...cfg });
  return data;
}

export async function apiPatch<T>(url: string, body: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.patch<T>(url, body, { signal: cfg?.signal, ...cfg });
  return data;
}

export async function apiPut<T>(url: string, body?: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.put<T>(url, body, { signal: cfg?.signal, ...cfg });
  return data;
}

export async function apiDelete<T = any>(url: string, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.delete<T>(url, { signal: cfg?.signal, ...cfg });
  return data;
}
