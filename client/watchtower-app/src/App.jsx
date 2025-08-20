import "leaflet/dist/leaflet.css";
import "./App.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerPng from "./img/marker.png";

const custIcon = L.icon({
  iconUrl: markerPng,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

/* Geographic fence (example: Greater London) */
const londonBounds = [
  [51.28, -0.51], // SW
  [51.70,  0.33], // NE
];

export default function App() {
  const markers = [
    { id: 1, geocode: [51.5014, -0.1419], popUp: "Buckingham Palace" },
    { id: 2, geocode: [51.5152, -0.1419], popUp: "Oxford Circus" },
    { id: 3, geocode: [51.5132, -0.1589], popUp: "Marble Arch" },
  ];

  return (
    <div className="phonescreen">
      <MapContainer
        center={[51.5072, -0.1276]}
        zoom={13}
        /* Fill the phone frame (CSS handles sizing) */
        style={{ width: "100%", height: "100%" }}
        /* Lock the map to your box geographically */
        maxBounds={londonBounds}
        maxBoundsViscosity={1.0}   // 1 = hard lock at the edge
        minZoom={10}
        maxZoom={18}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          noWrap={true}           // prevent world from repeating
        />

        {markers.map(m => (
          <Marker key={m.id} position={m.geocode} icon={custIcon}>
            <Popup>{m.popUp}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}