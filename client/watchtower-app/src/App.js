//figure out how to install react-leaflet-cluster so that the icons can move to size
import "leaflet/dist/leaflet.css"
import './App.css';

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
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

  const createCustomClusterIcon = (cluster) => {
    return new divIcon({
      html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
      className: "custom-marker-cluster",
      iconSize: point(33, 33, true)
    })
  }
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

      <TileLayer url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'/>
      
      <MarkerClusterGroup 
        chunkedLoading
        iconCreateFunction={createCustomClusterIcon}
      >

      {markers.map(marker =>
        <Marker position={marker.geocode} icon={custIcon}>
          <Popup>{marker.popUp}</Popup>
        </Marker>
      )}
      </MarkerClusterGroup>
    </MapContainer>
  );
}