//figure out how to install react-leaflet-cluster so that the icons can move to size
import "leaflet/dist/leaflet.css"
import './App.css';


import { MapContainer, MapLibreTileLayer, Marker, Popup } from "react-leaflet"
import L, { Icon, divIcon } from "leaflet";
import Supercluster from "supercluster";
import { useEffect, useMemo, useState } from "react";
import { popUp } from 'leaflet';

export default function App() {
  //mock markers for now to undertand:
  const markers = [
    {
      id: 1, geocode: [51.5014, 0.1419], 
      popUp: "Buckingham Palace", //buckingham palace

    },
    {
      id: 2, geocode: [51.5152, 0.1419],
      popUp: "Oxford Circus"
    },
    {
      id: 3, geocode: [51.5132, 0.1589],
      popUp: "Marble Arch"
    }
  ];

  const custIcon = new Icon({
    iconUrl: require("./img/marker.png"),
    iconSize: [38, 38]
  })

  return (
    <MapContainer 
      center={[51.5072, 0.1276]} 
      zoom={13} 
      style={{height:"100vh"}}
      >

      <MapLibreTileLayer
        attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        url="https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
      />

      {markers.map(marker =>
        <Marker position={marker.geocode} icon={custIcon}>
          <Popup>{marker.popUp}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}