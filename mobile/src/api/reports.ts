import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

export type ReportUserDto = { id: number; username: string };
export type ReportPropertiesDto = {
  id: number;
  type: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string | null;
  status: string;
  upvotes: number;
  upvotedByMe: boolean;
  description: string;
  user: ReportUserDto;
};

export type GeoJsonFeature<TProps> = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: TProps;
};

export type GeoJsonFeatureCollection<TProps> = {
  type: "FeatureCollection";
  features: Array<GeoJsonFeature<TProps>>;
};

export type CreateReportRequest = {
  type: string;
  description: string;
  occurredAt: string; // ISO
  lat: number;
  lng: number;
};
export type CreateReportResponse = {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string | null;
};

export async function listReportsByBbox(
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  types?: string[],
  from?: string,
  to?: string,
  opts?: { signal?: AbortSignal }
) {
  const qs = new URLSearchParams({ bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}` });
  types?.forEach((t) => qs.append("type", t));
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return apiGet<GeoJsonFeatureCollection<ReportPropertiesDto>>(`/reports?${qs.toString()}`, { signal: opts?.signal });
}

export async function createReport(payload: CreateReportRequest) {
  return apiPost<CreateReportResponse>("/reports", payload);
}

export async function getReport(id: number) {
  return apiGet<GeoJsonFeature<ReportPropertiesDto>>(`/reports/${id}`);
}

export async function updateReport(id: number, description: string) {
  return apiPatch<{ id: number; updatedAt: string }>(`/reports/${id}`, { description });
}

/** Upvote (PUT) / Remove upvote (DELETE) — matches contract/controller */
export async function upvoteReport(id: number) {
  return apiPut<{ id: number; upvotes: number; upvotedByMe: boolean }>(`/reports/${id}/upvote`);
}
export async function removeUpvoteReport(id: number) {
  return apiDelete<{ id: number; upvotes: number; upvotedByMe: boolean }>(`/reports/${id}/upvote`);
}

/** Delete report (owner/admin) */
export async function deleteReport(id: number) {
  return apiDelete<void>(`/reports/${id}`);
}