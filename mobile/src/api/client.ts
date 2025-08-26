// src/api/client.ts
import axios, { AxiosRequestConfig } from "axios";

/** GET with React Query cancellation support */
export async function apiGet<T>(url: string, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.get<T>(url, { signal: cfg?.signal, ...cfg });
  return data;
}

/** POST */
export async function apiPost<T>(url: string, body: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.post<T>(url, body, { signal: cfg?.signal, ...cfg });
  return data;
}

/** PATCH */
export async function apiPatch<T>(url: string, body: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.patch<T>(url, body, { signal: cfg?.signal, ...cfg });
  return data;
}

/** PUT */
export async function apiPut<T>(url: string, body?: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.put<T>(url, body, { signal: cfg?.signal, ...cfg });
  return data;
}

/** DELETE */
export async function apiDelete<T = any>(url: string, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  const { data } = await axios.delete<T>(url, { signal: cfg?.signal, ...cfg });
  return data;
}
