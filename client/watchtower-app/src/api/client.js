// Basic API client using fetch
const API_BASE = "https://watchtower-api-backend.onrender.com";

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(data?.error || "Unknown error");
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      const error = new Error("Unable to connect to the server");
      error.status = 0;
      error.networkError = true;
      throw error;
    }
    throw err;
  }
}
