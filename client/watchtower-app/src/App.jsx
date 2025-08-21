import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Location from "./leaflet/Location";
import LiveReports from "./Pages/LiveReports";
import AccountGate from "./Pages/AccountGate";
import Login from "./Pages/LoginPage";
import Signup from "./Pages/Signup";
import UserDashboard from "./Pages/UserProfile"; // exports default already

export const isSignedIn = () => !!localStorage.getItem("token");

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home is the map page */}
        <Route path="/" element={<Location />} />

        {/* Live reports placeholder */}
        <Route path="/live" element={<LiveReports />} />

        <Route
          path="/account"
          element={isSignedIn() ? <UserDashboard /> : <AccountGate />}
        />

        {/* Auth routes */}
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Direct dashboard path if you navigate there explicitly */}
        <Route
          path="/dashboard"
          element={isSignedIn() ? <UserDashboard /> : <Navigate to="/account" replace />}
        />

        {/* Report page placeholder for your “Report Now” CTA */}
        <Route path="/report" element={<LiveReports title="Report (coming soon)" />} />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}


