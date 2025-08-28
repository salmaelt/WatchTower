const API_BASE = "https://watchtower-api-backend.onrender.com";

export async function fetchMarkers() {
  const res = await fetch(`${API_BASE}/markers`);
  if (!res.ok) throw new Error("Failed to fetch markers");
  return res.json(); // [{id, lat, lng, title, ...}]
}