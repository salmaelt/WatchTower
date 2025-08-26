const API_BASE = import.meta?.env?.VITE_API_URL || process.env.REACT_APP_API_URL || "http://localhost:3001";

export async function fetchMarkers() {
  const res = await fetch(`${API_BASE}/markers`);
  if (!res.ok) throw new Error("Failed to fetch markers");
  return res.json(); // [{id, lat, lng, title, ...}]
}