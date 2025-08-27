const BASE_URL = "http://localhost:5051";

// Helper to build headers
function getHeaders(token, contentType = "application/json") {
  const headers = { "Content-Type": contentType };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// --- Auth ---
export async function registerUser({ username, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw await res.json();
  return await res.json(); // contains token
}

export async function loginUser({ usernameOrEmail, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  if (!res.ok) throw await res.json();
  return await res.json(); // contains token
}

export async function deleteMe(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return true;
}

// --- Reports ---
export async function getReports({ bbox, type, from, to }, token) {
  const url = new URL(`${BASE_URL}/reports`);
  url.searchParams.append("bbox", bbox);
  if (type) type.forEach(t => url.searchParams.append("type", t));
  if (from) url.searchParams.append("from", from);
  if (to) url.searchParams.append("to", to);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token, "application/geo+json"),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function getReport(id, token) {
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "GET",
    headers: getHeaders(token, "application/geo+json"),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function createReport(data, token) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function updateReport(id, data, token) {
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function upvoteReport(id, token) {
  const res = await fetch(`${BASE_URL}/reports/${id}/upvote`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function removeUpvoteReport(id, token) {
  const res = await fetch(`${BASE_URL}/reports/${id}/upvote`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function deleteReport(id, token) {
  const res = await fetch(`${BASE_URL}/reports/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return true;
}

// --- Comments ---
export async function getComments(reportId, token) {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/comments`, {
    method: "GET",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function addComment(reportId, commentText, token) {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/comments`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ commentText }),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function upvoteComment(commentId, token) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}/upvote`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function removeUpvoteComment(commentId, token) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}/upvote`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function deleteComment(commentId, token) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return true;
}
