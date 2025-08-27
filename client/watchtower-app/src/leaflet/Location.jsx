import "leaflet/dist/leaflet.css";
import "../App.css";
import "./Location.css";

import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGeoLocation from "../hooks/GeoLocation";
import BottomNavBar from "../components/BottomNavBar/BottomNavBar";
import markerPng from "../img/marker.png";
import { getReports as fetchReports } from "../api/reports";
import { useAuth } from "../api/AuthContext";

const custIcon = L.icon({ iconUrl: markerPng, iconSize: [38, 38], iconAnchor: [19, 38] });

const londonBounds = [
  [51.28, -0.51],
  [51.70,  0.33],
];

function boundsToBbox(bounds) {
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

export default function Location() {
  const mapRef = useRef(null);
  const [bounded, setBounded] = useState(true);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();
  const isSignedIn = !!localStorage.getItem("token");
  const geo = useGeoLocation();
  const { token } = useAuth?.() || {};

  /* WHEN API IS CONNECTED REPLACE CONT MARKERS WITH THIS
    import useMarkers from "../hooks/Markers";
    const { data: markers } = useMarkers();

    // and render:
    {markers.map(m => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={custIcon}>
        <Popup>{m.title}</Popup>
    </Marker>
    ))}
  */

  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadForBounds(b) {
      try {
        const bbox = boundsToBbox(b || londonBounds);
        const geojson = await fetchReports({ bbox }, token || localStorage.getItem("token"));
        const items = (geojson?.features || []).map((f) => ({
          id: f.properties?.id ?? `${f.geometry?.coordinates?.join(",")}`,
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          description: f.properties?.description || "Report",
        })).filter((r) => typeof r.lat === "number" && typeof r.lng === "number");
        if (!cancelled) setReports(items);
      } catch (e) {
        if (!cancelled) setError("Failed to load reports.");
      }
    }

    const map = mapRef.current;
    if (!map) {
      loadForBounds(londonBounds);
    } else {
      const b = map.getBounds();
      const current = [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]];
      loadForBounds(current);
    }

    return () => { cancelled = true; };
  }, [token]);

  const handleMoveEnd = () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const current = [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]];
    // fire and forget, don't duplicate code
    (async () => {
      try {
        const bbox = boundsToBbox(current);
        const geojson = await fetchReports({ bbox }, token || localStorage.getItem("token"));
        const items = (geojson?.features || []).map((f) => ({
          id: f.properties?.id ?? `${f.geometry?.coordinates?.join(",")}`,
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          description: f.properties?.description || "Report",
        })).filter((r) => typeof r.lat === "number" && typeof r.lng === "number");
        setReports(items);
      } catch {}
    })();
  };

  const handleSeeLive = async () => {
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
    } catch {/* optional: add locate() fallback */}
  };

  const handleBackToLondon = () => {
    const map = mapRef.current;
    setBounded(true);
    setMe(null);
    if (map) {
      map.setMaxBounds(L.latLngBounds(londonBounds));
      map.options.maxBoundsViscosity = 1.0;
      map.fitBounds(londonBounds, { padding: [20, 20] });
    }
  };

  const handleReportNow = () => {
    navigate(isSignedIn ? "/report" : "/signin");
  };

  return (
    <div className="phonescreen">
     
        <div className="map-box">
          <MapContainer
            center={[51.5072, -0.1276]}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
            maxBounds={bounded ? londonBounds : undefined}
            maxBoundsViscosity={bounded ? 1.0 : undefined}
            minZoom={10}
            maxZoom={18}
            whenCreated={(map) => (mapRef.current = map)}
            onmoveend={handleMoveEnd}
          >
            <TileLayer
              url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${process.env.REACT_APP_STADIA_KEY ?? "YOUR_KEY"}`}
              attribution="&copy; OpenStreetMap contributors &copy; Stadia Maps"
              noWrap={bounded}
            />

            {reports.map((r) => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={custIcon}>
                <Popup>{r.description}</Popup>
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

          <div className="map-ui">
            <button className="map-btn" onClick={handleSeeLive}>See live location</button>
            {!bounded && <button className="map-btn" onClick={handleBackToLondon}>Back to London</button>}
          </div>
          </div>
      

      <div className="actions">
        <button className="report-btn" onClick={handleReportNow} aria-label="Report live now">
          <span>Report Live Now</span>
          <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}