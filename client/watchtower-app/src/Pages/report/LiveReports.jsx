import "leaflet/dist/leaflet.css";
import "../../App.css";
import "./Report.css";

import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from "react-leaflet";
import L from "leaflet";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import { getReports as fetchReports } from "../../api/reports";
import { useAuth } from "../../api/AuthContext";
import React from "react";
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
  const [reports, setReports] = React.useState([]);
  const [error, setError] = React.useState("");
  const [me, setMe] = React.useState(null);
  const [bounded, setBounded] = React.useState(true);
  const mapRef = React.useRef(null);
  const geo = useGeoLocation();

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const bbox = boundsToBbox(londonBounds);
        const geojson = await fetchReports({ bbox }, token || localStorage.getItem("token"));
        // Expecting a FeatureCollection of point features
        const items = (geojson?.features || []).map((f) => ({
          id: f.properties?.id ?? `${f.geometry?.coordinates?.join(",")}`,
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          description: f.properties?.description || "Report",
          time: f.properties?.occurredAt || f.properties?.createdAt,
          locationText: f.properties?.locationText,
        })).filter((r) => typeof r.lat === "number" && typeof r.lng === "number");
        if (!cancelled) setReports(items);
      } catch (e) {
        if (!cancelled) setError("Failed to load live reports.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

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
                <Marker key={r.id} position={[r.lat, r.lng]} icon={custIcon}>
                  <Popup>
                    <strong>{r.description}</strong><br />
                    {new Date(r.time || r.createdAt).toLocaleString()}<br />
                    {r.locationText || "Pinned on map"}
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
              {reports.length === 0 && !error && <p className="muted">Nothing yet. Submit a report to see it here.</p>}
              {reports.map(r => (
                <div className="recent-item" key={r.id}>
                  <div className="ri-title">{r.description}</div>
                  <div className="ri-meta">
                    {new Date(r.time || r.createdAt).toLocaleString()} · {r.locationText || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>

      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}