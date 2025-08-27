import { apiRequest } from "./client";

export async function getReports(params = {}, token) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/reports${query ? `?${query}` : ""}`, {
    method: "GET",
    token,
  });
}

export async function getReport(id, token) {
  return apiRequest(`/reports/${id}`, {
    method: "GET",
    token,
  });
}

export async function createReport(data, token) {
  return apiRequest(`/reports`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function updateReport(id, data, token) {
  return apiRequest(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function upvoteReport(id, token) {
  return apiRequest(`/reports/${id}/upvote`, {
    method: "PUT",
    token,
  });
}

export async function removeUpvoteReport(id, token) {
  return apiRequest(`/reports/${id}/upvote`, {
    method: "DELETE",
    token,
  });
}

export async function deleteReport(id, token) {
  return apiRequest(`/reports/${id}`, {
    method: "DELETE",
    token,
  });
}
