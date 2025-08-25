import { apiGet, apiPatch, apiPost, apiDelete, apiPut } from "./client";
import type { GeoJsonFeatureCollection } from "../types/geojson";
import type { ReportPropertiesDto, CreateReportRequest, CreateReportResponse } from "../types/dto";

export async function listReportsByBbox(
  bbox: { minLng:number; minLat:number; maxLng:number; maxLat:number },
  types?: string[], from?: string, to?: string
) {
  const qs = new URLSearchParams({ bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}` });
  types?.forEach(t => qs.append("type", t));
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return apiGet<GeoJsonFeatureCollection<ReportPropertiesDto>>(`/reports?${qs.toString()}`);
}

export async function createReport(payload: CreateReportRequest) {
  return apiPost<CreateReportResponse>("/reports", payload);
}

export async function upvoteReport(id: number) {
  // PUT /reports/{id}/upvote (no body needed)
  return apiPut<{ id:number; upvotes:number; upvotedByMe:boolean }>(`/reports/${id}/upvote`);
}

export async function removeUpvoteReport(id: number) {
  // DELETE /reports/{id}/upvote
  return apiDelete<{ id:number; upvotes:number; upvotedByMe:boolean }>(`/reports/${id}/upvote`);
}