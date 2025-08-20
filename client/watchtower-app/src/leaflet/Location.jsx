import "leaflet/dist/leaflet.css";
import "../App.css";
import "../leaflet/Location.css"

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import { useMemo, useRef, useState } from "react";
import useGeoLocation from "../hooks/GeoLocation";
import markerPng from "../img/marker.png";   


const custIcon = L.icon({
  iconUrl: markerPng,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});


const londonBounds = [
  [51.28, -0.51], // SW
  [51.70,  0.33], // NE
];

export default function Location() {
  const mapRef = useRef(null);
  const [bounded, setBounded] = useState(true);   // locked to London initially
  const [me, setMe] = useState(null);             

  const geo = useGeoLocation();

  const markers = useMemo(() => ([
    { id: 1, geocode: [51.5014, -0.1419], popUp: "Buckingham Palace" },
    { id: 2, geocode: [51.5152, -0.1419], popUp: "Oxford Circus" },
    { id: 3, geocode: [51.5132, -0.1589], popUp: "Marble Arch" },
  ]), []);

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
        setTimeout(() => {
          map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
        }, 0);
      }
    } catch (e) {
      map.once("locationfound", (e2) => {
        const { lat, lng } = e2.latlng;
        setMe({ lat, lng, accuracy: e2.accuracy });
        map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
      });
      map.locate({ setView: false, enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
    }
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

  return (
    
    <div className="phonescreen">
        <h2>WatchTower</h2>
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
        >
        {/*<TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            noWrap={bounded}
          />*/}

          <TileLayer
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=6dd22983-3d42-4c34-9098-429c316e9f5d"
                attribution='&copy; OpenStreetMap contributors &copy; Stadia Maps'
            />

          {markers.map((m) => (
            <Marker key={m.id} position={m.geocode} icon={custIcon}>
              <Popup>{m.popUp}</Popup>
            </Marker>
          ))}

          {me?.lat && me?.lng && (
            <>
              {typeof me.accuracy === "number" && me.accuracy > 0 && (
                <Circle
                  center={[me.lat, me.lng]}
                  radius={me.accuracy}
                  pathOptions={{ color: "#4ab62c", weight: 1, fillOpacity: 0.15 }}
                />
              )}
              <CircleMarker
                center={[me.lat, me.lng]}
                radius={6}
                pathOptions={{ color: "#305d2d", fill: true, fillOpacity: 1 }}
              />
            </>
          )}
        </MapContainer>

        {/* Buttons */}
        <div className="map-ui">
          <button className="map-btn" onClick={handleSeeLive}>See live location</button>
          {!bounded && (
            <button className="map-btn" onClick={handleBackToLondon}>Back to London</button>
          )}
        </div>
      </div>
    </div>
  );
}