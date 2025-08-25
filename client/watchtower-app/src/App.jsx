import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./Pages/HomePage";
import Signup from "./Pages/Signup";
import UserProfile from "./Pages/UserProfile";     
import Login from "./Pages/LoginPage";
import Dashboard from "./leaflet/Location"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="./Pages/Homepage" element={<Homepage />} />
        <Route path="/Pages/Signup" element={<Login />} />
        <Route path="./Pages/Signup" element={<Signup />} />
        <Route path="./Pages/UserProfile" element={<UserProfile />} />
        <Route path="./leaflet/Location" element={<Dashboard />} />


        {/* 404 fallback (optional) */}
        <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}


