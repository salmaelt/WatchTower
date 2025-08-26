import axios, { AxiosRequestConfig } from "axios";
//import Constants from "expo-constants";

//COMMENTED OUT TO SEE WHY BUG FROM TOM
/*const extra =
  (Constants.expoConfig?.extra as any) ||
  (Constants as any).manifest2?.extra ||
  (Constants as any).manifest?.extra ||
  {};

axios.defaults.baseURL =
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ||
  "http://192.168.1.209:4000"; */

/*axios.defaults.baseURL =
  (Constants.expoConfig?.extra as any)?.API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:4000"; */

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
