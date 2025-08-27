import "leaflet/dist/leaflet.css";
import "../../App.css";
import "./Report.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import { getReports } from "../../store/reports";
import markerPng from "../../img/marker.png";

const custIcon = L.icon({ 
  iconUrl: markerPng, 
  iconSize: [38, 38], 
  iconAnchor: [19, 38] 
});

const londonBounds = [[51.28, -0.51],[51.70, 0.33]];

export default function LiveReports() {
  const isSignedIn = !!localStorage.getItem("token");
  const reports = getReports();

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
              minZoom={10}
              maxZoom={18}
              maxBounds={londonBounds}
              maxBoundsViscosity={0.8}
              style={{ width:"100%", height:"100%" }}
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
            </MapContainer>
          </div>
        </section>

        <section className="form-list">
          <aside className="recent-card" style={{ width:"90%", margin:"0 50px 25px" }}>
            <h3>Latest reports</h3>
            <div className="recent-list">
              {reports.length === 0 && <p className="muted">Nothing yet. Submit a report to see it here.</p>}
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