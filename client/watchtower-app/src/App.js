import logo from './logo.svg';
import './App.css';

import { MapContainer, TileLayer } from "react-leaflet"

export default function App() {
  return (
    <MapContainer center={[51.5072, 0.1276]} zoom={13}>

      <TileLayer 
        attribution='&copy; <a href=""'
      />
    </MapContainer>
  );
}
