const BASE_URL = "http://localhost:5051";

function getHeaders(token?: string, contentType: string = "application/json") {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// --- Auth ---
export async function registerUser(data: { username: string; email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function loginUser(data: { usernameOrEmail: string; password: string }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function deleteMe(token: string) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return true;
}

// --- Reports ---
export async function getReports(params: {
  bbox: string;
  type?: string[];
  from?: string;
  to?: string;
}, token?: string) {
  const url = new URL(`${BASE_URL}/reports`);
  url.searchParams.append("bbox", params.bbox);
  if (params.type) params.type.forEach(t => url.searchParams.append("type", t));
  if (params.from) url.searchParams.append("from", params.from);
  if (params.to) url.searchParams.append("to", params.to);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token, "application/geo+json"),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function getReport(id: number, token?: string) {
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "GET",
    headers: getHeaders(token, "application/geo+json"),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function createReport(data: {
  type: string;
  description: string;
  occurredAt: string;
  lat: number;
  lng: number;
}, token: string) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function updateReport(id: number, data: { description: string }, token: string) {
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function upvoteReport(id: number, token: string) {
  const res = await fetch(`${BASE_URL}/reports/${id}/upvote`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function removeUpvoteReport(id: number, token: string) {
  const res = await fetch(`${BASE_URL}/reports/${id}/upvote`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function deleteReport(id: number, token: string) {
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return true;
}

// --- Comments ---
export async function getComments(reportId: number, token?: string) {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/comments`, {
    method: "GET",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function addComment(reportId: number, data: { commentText: string }, token: string) {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/comments`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function upvoteComment(commentId: number, token: string) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}/upvote`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function removeUpvoteComment(commentId: number, token: string) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}/upvote`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function deleteComment(commentId: number, token: string) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return true;
}
