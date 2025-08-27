import "leaflet/dist/leaflet.css";
import "../../App.css";
import "./Report.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import useGeoLocation from "../../hooks/GeoLocation";
import { createReport } from "../../api/watchtowerApi";
import { useAuth } from "../../api/AuthContext";
import markerPng from "../../img/marker.png";

const custIcon = L.icon({
  iconUrl: markerPng,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

const londonBounds = [
  [51.28, -0.51],
  [51.70, 0.33],
];

const demoMarkers = [
  { id: "d1", lat: 51.5014, lng: -0.1419, title: "Buckingham Palace" },
  { id: "d2", lat: 51.5152, lng: -0.1419, title: "Oxford Circus" },
  { id: "d3", lat: 51.5132, lng: -0.1589, title: "Marble Arch" },
];

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function Report() {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const geo = useGeoLocation();
  const { token } = useAuth();
  const isSignedIn = !!token;

  const [form, setForm] = useState({
    locationText: "",
    description: "",
    time: "",
  });
  const [picked, setPicked] = useState(null); // 
  const [me, setMe] = useState(null); // 
  const [error, setError] = useState("");

  // Reports list not needed on create page; removed erroneous async call

  const handleUseMyLocation = async () => {
    try {
      const fix = await geo.request();
      if (fix?.coordinates) {
        const { lat, lng } = fix.coordinates;
        setPicked({ lat, lng });
        setMe({ lat, lng, accuracy: fix.accuracy ?? 25 });
        const map = mapRef.current;
        if (map) {
          map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
        }
      }
    } catch (e) {
      setError(e?.message || "Could not get your location.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!picked)
      return setError(
        "Please tap on the map (or use your location) to set where it happened."
      );
    if (!form.description.trim())
      return setError("Please add a brief description.");
    if (!form.time) return setError("Please select when it happened.");

    try {
      const reportData = {
        type: "phone_theft",
        description: form.description.trim(),
        occurredAt: new Date(form.time).toISOString(),
        lat: picked.lat,
        lng: picked.lng,
      };
      await createReport(reportData, token);
      navigate(`/report/thanks`);
    } catch (err) {
      setError("Failed to submit report.");
    }
  };

  return (
    <div className="phonescreen">
      <div className="brand-title"></div>
        <BottomNavBar isSignedIn={isSignedIn} />
      <div className="dash-wrap">
        <div className="dash-header">
          <h2>Recent Report</h2>
        </div>
     </div>

      <div className="report-scroll">
        <div className="report-wrap">
          <section className="map-card">
            <div className="map-shell">
              <MapContainer
                whenCreated={(m) => (mapRef.current = m)}
                center={[51.5072, -0.1276]}
                zoom={13}
                minZoom={10}
                maxZoom={18}
                maxBounds={londonBounds}
                maxBoundsViscosity={0.8}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${
                    process.env.REACT_APP_STADIA_KEY ?? "YOUR_KEY"
                  }`}
                  attribution="&copy; OpenStreetMap contributors &copy; Stadia Maps"
                  noWrap
                />

                {demoMarkers.map((m) => (
                  <Marker key={m.id} position={[m.lat, m.lng]} icon={custIcon}>
                    <Popup>{m.title}</Popup>
                  </Marker>
                ))}

                {picked && (
                  <Marker position={[picked.lat, picked.lng]} icon={custIcon}>
                    <Popup>Incident location</Popup>
                  </Marker>
                )}

                {me?.lat && me?.lng && (
                  <>
                    {typeof me.accuracy === "number" && me.accuracy > 0 && (
                      <Circle
                        center={[me.lat, me.lng]}
                        radius={me.accuracy}
                        pathOptions={{
                          color: "#4ab62c",
                          weight: 1,
                          fillOpacity: 0.15,
                        }}
                      />
                    )}
                    <CircleMarker
                      center={[me.lat, me.lng]}
                      radius={6}
                      pathOptions={{
                        color: "#305d2d",
                        fill: true,
                        fillOpacity: 1,
                      }}
                    />
                  </>
                )}
                {/*Allowing users to click a point on the map and its corresponding lat,long*/}
                <ClickCapture onPick={setPicked} />
              </MapContainer>
            </div>

            <div className="map-actions">
              <button className="map-btn" onClick={handleUseMyLocation}>
                Use my location
              </button>
              <span className="hint">Tap the map to choose a spot</span>
            </div>
          </section>

          <section className="form-list">
            <form className="report-card" onSubmit={onSubmit}>
              <h3>Report an incident</h3>

              <div className="field">
                <label className="label" htmlFor="locationText">
                  Location (optional)
                </label>
                <input
                  id="locationText"
                  className="input"
                  placeholder="e.g., outside Oxford Circus"
                  value={form.locationText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, locationText: e.target.value }))
                  }
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="description">
                  Brief description
                </label>
                <textarea
                  id="description"
                  className="input textarea"
                  rows={3}
                  maxLength={280}
                  placeholder="What happened?"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="time">
                  Time of incident
                </label>
                <input
                  id="time"
                  className="input"
                  type="datetime-local"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                />
              </div>

              {picked && (
                <div className="picked-row">
                  <span>Chosen point:</span>
                  <code>
                    {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
                  </code>
                </div>
              )}

              {error && <div className="error">{error}</div>}

              <div className="actions-row" style={{ marginTop: 10 }}>
                <button type="submit" className="btn-primary">
                  Report Now
                  <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 5l7 7-7 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>

            
          </section>

          <div className="bottom-pad" />
        </div>
      </div>

      
    </div>
  );
}