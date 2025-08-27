// src/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

/** A normalized error shape all API calls will throw on failure */
export class ApiError extends Error {
  status: number;        // HTTP status (0 => network/unknown)
  data: any;             // server response body (ProblemDetails, etc.)
  isNetwork: boolean;    // true if there was no HTTP response
  constructor(status: number, data: any, message?: string, isNetwork = false) {
    super(
      message ??
        data?.title ??
        data?.detail ??
        data?.message ??
        (status ? `Request failed with status ${status}` : "Network error")
    );
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetwork = isNetwork;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError || (typeof e === "object" && e !== null && (e as any).name === "ApiError");
}

function normalizeAndThrow(err: unknown): never {
  // Axios error path
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const status = ax.response?.status ?? 0;
    const data = ax.response?.data ?? null;
    const isNetwork = !ax.response;
    throw new ApiError(status, data, ax.message, isNetwork);
  }
  // Unknown error path
  const anyErr = err as any;
  throw new ApiError(0, null, anyErr?.message ?? "Request failed", true);
}

/** GET with React Query cancellation support */
export async function apiGet<T>(url: string, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  try {
    const { data } = await axios.get<T>(url, { signal: cfg?.signal, ...cfg });
    return data;
  } catch (err) {
    normalizeAndThrow(err);
  }
}

/** POST */
export async function apiPost<T>(url: string, body: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  try {
    const { data } = await axios.post<T>(url, body, { signal: cfg?.signal, ...cfg });
    return data;
  } catch (err) {
    normalizeAndThrow(err);
  }
}

/** PATCH */
export async function apiPatch<T>(url: string, body: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  try {
    const { data } = await axios.patch<T>(url, body, { signal: cfg?.signal, ...cfg });
    return data;
  } catch (err) {
    normalizeAndThrow(err);
  }
}

/** PUT */
export async function apiPut<T>(url: string, body?: any, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  try {
    const { data } = await axios.put<T>(url, body, { signal: cfg?.signal, ...cfg });
    return data;
  } catch (err) {
    normalizeAndThrow(err);
  }
}

/** DELETE */
export async function apiDelete<T = any>(url: string, cfg?: AxiosRequestConfig & { signal?: AbortSignal }) {
  try {
    const { data } = await axios.delete<T>(url, { signal: cfg?.signal, ...cfg });
    return data;
  } catch (err) {
    normalizeAndThrow(err);
  }
}
