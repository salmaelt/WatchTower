/*export default function App() {
  return <Location />;
}*/

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Location from "./leaflet/Location";

function Placeholder({ title }) {
  return <div style={{ padding: 24 }}><h2>{title}</h2><p>Coming soon…</p></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Location />} />
        <Route path="/live" element={<Placeholder title="Live Reports" />} />
        <Route path="/report" element={<Placeholder title="Report" />} />
        <Route path="/signin" element={<Placeholder title="Sign in" />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

