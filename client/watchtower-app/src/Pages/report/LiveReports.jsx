import "leaflet/dist/leaflet.css";
import "../../App.css";
import "./Report.css";

import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from "react-leaflet";
import L from "leaflet";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../api/AuthContext";
import SafetyTips from "../../components/SafetyTips";
import { getReports as fetchReports, upvoteReport, removeUpvoteReport } from "../../api/reports";
import useGeoLocation from "../../hooks/GeoLocation";
import markerPng from "../../img/marker.png";

const custIcon = L.icon({ 
  iconUrl: markerPng, 
  iconSize: [38, 38], 
  iconAnchor: [19, 38] 
});

const londonBounds = [[51.28, -0.51],[51.70, 0.33]];


function boundsToBbox(bounds) {
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;
  return `${minLng},${minLat},${maxLng},${maxLat}`; // minLng,minLat,maxLng,maxLat
}

export default function LiveReports() {
  const { token } = useAuth();
  const isSignedIn = !!(token || localStorage.getItem("token"));
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);
  const [bounded, setBounded] = useState(true);
  const mapRef = useRef(null);
  const geo = useGeoLocation();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const bbox = boundsToBbox(londonBounds);
        const geojson = await fetchReports({ bbox }, token || localStorage.getItem("token"));
        const currentUserId = Number(localStorage.getItem("userId"));
        const items = (geojson?.features || []).map((f) => ({
          id: f.properties?.id ?? `${f.geometry?.coordinates?.join(",")}`,
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          description: f.properties?.description || "Report",
          time: f.properties?.occurredAt || f.properties?.createdAt,
          locationText: f.properties?.locationText,
          upvotes: f.properties?.upvotes ?? 0,
          upvotedByMe: !!f.properties?.upvotedByMe,
          ownerUserId: f.properties?.user?.id,
          ownReport: typeof currentUserId === "number" && !Number.isNaN(currentUserId) && f.properties?.user?.id === currentUserId,
        })).filter((r) => typeof r.lat === "number" && typeof r.lng === "number");
        if (!cancelled) setReports(items);
      } catch (e) {
        if (!cancelled) setError("Failed to load live reports.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  async function handleToggleUpvote(id, upvotedByMe) {
    if (!isSignedIn) {
      alert("Please sign in to upvote.");
      return;
    }
    const target = reports.find((r) => r.id === id);
    if (target?.ownReport) {
      alert("You cannot upvote your own report.");
      return;
    }
    try {
      const authToken = token || localStorage.getItem("token");
      if (upvotedByMe) {
        const res = await removeUpvoteReport(id, authToken);
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, upvotes: res.upvotes, upvotedByMe: res.upvotedByMe } : r));
      } else {
        const res = await upvoteReport(id, authToken);
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, upvotes: res.upvotes, upvotedByMe: res.upvotedByMe } : r));
      }
    } catch (e) {
      const message = e?.title || e?.error || "Failed to update upvote.";
      setError(message);
    }
  }

  async function handleSeeLive() {
    const map = mapRef.current;
    if (!map) return;

    map.setMaxBounds(null);
    map.options.maxBounds = undefined;
    map.options.maxBoundsViscosity = 0;
    setBounded(false);

    try {
      const fix = await geo.request();
      if (fix?.coordinates) {
        const { lat, lng } = fix.coordinates;
        setMe({ lat, lng, accuracy: fix.accuracy });
        setTimeout(() => map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true }), 0);
      }
    } catch {}
  }

  function handleBackToLondon() {
    const map = mapRef.current;
    setBounded(true);
    setMe(null);
    if (map) {
      map.setMaxBounds(L.latLngBounds(londonBounds));
      map.options.maxBoundsViscosity = 1.0;
      map.fitBounds(londonBounds, { padding: [20, 20] });
    }
  }

  return (
    <div className="phonescreen">
      <BottomNavBar isSignedIn={isSignedIn} />
      <div className="report-wrap">
       <h2>Live Reports</h2>
        <section className="map-card">
          <div className="map-shell">
            <MapContainer
              center={[51.5072, -0.1276]}
              zoom={13}
              style={{ width:"100%", height:"100%" }}
              whenCreated={(map) => (mapRef.current = map)}
              maxBounds={bounded ? londonBounds : undefined}
              maxBoundsViscosity={bounded ? 1.0 : undefined}
              minZoom={10}
              maxZoom={18}
            >
              <TileLayer
                url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${process.env.REACT_APP_STADIA_KEY ?? "YOUR_KEY"}`}
                attribution="&copy; OpenStreetMap contributors &copy; Stadia Maps"
                noWrap
              />

              {reports.map(r => (
                <Marker key={r.id || r.properties?.id} position={r.geometry ? [r.geometry.coordinates[1], r.geometry.coordinates[0]] : [0,0]} icon={custIcon}>
                  <Popup>
                    <strong>{r.properties?.description || r.description}</strong><br />
                    {new Date(r.properties?.occurredAt || r.time || r.createdAt).toLocaleString()}<br />
                    {r.properties?.locationText || r.locationText || "Pinned on map"}
                    <div style={{display:"flex", flexDirection:"column", gap:6}}>
                      <strong>{r.description}</strong>
                      <span>{new Date(r.time || r.createdAt).toLocaleString()}</span>
                      <span>{r.locationText || "Pinned on map"}</span>
                      <button
                        onClick={() => handleToggleUpvote(r.id, r.upvotedByMe)}
                        className="map-btn"
                        style={{alignSelf:"flex-start"}}
                      >
                        {r.upvotedByMe ? `Remove Upvote (${r.upvotes})` : `Upvote (${r.upvotes})`}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {me?.lat && me?.lng && (
                <>
                  {typeof me.accuracy === "number" && me.accuracy > 0 && (
                    <Circle center={[me.lat, me.lng]} radius={me.accuracy}
                            pathOptions={{ color: "#4ab62c", weight: 1, fillOpacity: 0.15 }} />
                  )}
                  <CircleMarker center={[me.lat, me.lng]} radius={6}
                                pathOptions={{ color: "#305d2d", fill: true, fillOpacity: 1 }} />
                </>
              )}
            </MapContainer>
          </div>
          <div className="map-actions">
            <button className="map-btn" onClick={handleSeeLive}>See live location</button>
            {!bounded && <button className="map-btn" onClick={handleBackToLondon}>Back to London</button>}
          </div>
        </section>

        <section className="form-list">
          <aside className="recent-card" style={{ width:"90%", margin:"0 50px 25px" }}>
            <h3>Latest reports</h3>
            <div className="recent-list">
              {error && <p className="error">{error}</p>}
              {reports.length === 0 && !error && (
                <p className="muted">Nothing yet. Submit a report to see it here.</p>
              )}
              {reports.map((r) => (
                <div
                  className="recent-item"
                  key={r.id}
                  onClick={() => navigate(`/live/${r.id}`)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}
                >
                  <div>
                    <div className="ri-title">{r.description}</div>
                    <div className="ri-meta">
                      {new Date(r.time || r.createdAt).toLocaleString()} · {r.locationText || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <span className="ri-meta" aria-label="Total upvotes">{r.upvotes}</span>
                    <button
                      onClick={() => handleToggleUpvote(r.id, r.upvotedByMe)}
                      className="map-btn"
                      disabled={r.ownReport}
                      title={r.ownReport ? "You cannot upvote your own report" : undefined}
                    >
                      {r.ownReport ? "Your report" : r.upvotedByMe ? "Remove Upvote" : "Upvote"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
        {error && <div className="error">{error}</div>}
      </div>
      <BottomNavBar isSignedIn={isSignedIn} />

      <div style={{ padding: "0 12px 12px" }}>
        <SafetyTips />
      </div>

    </div>
  );
}