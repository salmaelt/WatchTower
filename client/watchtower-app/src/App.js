import logo from './logo.svg';
import "leaflet/dist/leaflet.css"
import './App.css';

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { Icon } from "leaflet"
import { popUp } from 'leaflet';

export default function App() {
  //mock markers for now to undertand:
  const markers = [
    {
      geocode: [51.5014, 0.1419], //buckingham palace
      popUp: "Buckingham Palace"
    },
    {
      geocode: [51.5152, 0.1419],
      popUp: "Oxford Circus"
    },
    {
      geocode: [51.5132, 0.1589],
      popUp: "Marble Arch"
    }
  ];

  const custIcon = new Icon({
    iconUrl: require("./img/marker.png"),
    iconSize: [38, 38]
  })
  return (
    <MapContainer center={[51.5072, 0.1276]} zoom={13}>

      <TileLayer 
        url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {markers.map(marker =>
        <Marker position={marker.geocode} icon={custIcon}>
          <Popup>{marker.popUp}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
