// Basic API client using fetch
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5051";

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw data || { error: "Unknown error" };
  return data;
}
