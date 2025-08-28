import { apiRequest } from "./client";

export async function getReports(params = {}, token) {
  try {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/reports${query ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  } catch (err) {
    console.warn("Failed to fetch reports:", err);
    return { features: [] };
  }
}

export async function getReport(id, token) {
  try {
    return await apiRequest(`/reports/${id}`, {
      method: "GET",
      token,
    });
  } catch (err) {
    console.warn(`Failed to fetch report ${id}:`, err);
    return null;
  }
}

export async function createReport(data, token) {
  try {
    return await apiRequest(`/reports`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  } catch (err) {
    console.warn("Failed to create report:", err);
    throw err;
  }
}

export async function updateReport(id, data, token) {
  try {
    return await apiRequest(`/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    });
  } catch (err) {
    console.warn(`Failed to update report ${id}:`, err);
    throw err;
  }
}

export async function upvoteReport(id, token) {
  try {
    return await apiRequest(`/reports/${id}/upvote`, {
      method: "PUT",
      token,
    });
  } catch (err) {
    console.warn(`Failed to upvote report ${id}:`, err);
    throw err;
  }
}

export async function removeUpvoteReport(id, token) {
  try {
    return await apiRequest(`/reports/${id}/upvote`, {
      method: "DELETE",
      token,
    });
  } catch (err) {
    console.warn(`Failed to remove upvote from report ${id}:`, err);
    throw err;
  }
}

export async function deleteReport(id, token) {
  try {
    return await apiRequest(`/reports/${id}`, {
      method: "DELETE",
      token,
    });
  } catch (err) {
    console.warn(`Failed to delete report ${id}:`, err);
    throw err;
  }
}
