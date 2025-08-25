import { apiGet, apiPatch, apiPost } from "./client";
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

export async function getReport(id: number) {
  return apiGet<{ type:"Feature"; geometry:{ type:"Point"; coordinates:[number,number] }; properties: ReportPropertiesDto }>(`/reports/${id}`);
}

export async function upvoteReport(id: number) {
  return apiPatch<{ id:number; upvotes:number; upvotedByMe:boolean }>(`/reports/${id}/upvote`, {});
}
