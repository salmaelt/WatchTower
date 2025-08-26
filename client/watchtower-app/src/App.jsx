import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Location from "./leaflet/Location";
import LiveReports from "./Pages/report/LiveReports";
import AccountGate from "./Pages/signup/AccountGate";
import Login from "./Pages/login/LoginPage";
import Signup from "./Pages/signup/Signup";
import UserDashboard from "./Pages/userdashboard/UserProfile";
import Report from "./Pages/report/Report";
import ReportThanks from "./Pages/report/ReportThanks";
import EditReport from "./Pages/report/EditReport";

export const isSignedIn = () => !!localStorage.getItem("token");

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Location />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report/thanks" element={<ReportThanks />} />
        <Route path="/live" element={<LiveReports />} />
        <Route
          path="/account"
          element={isSignedIn() ? <UserDashboard /> : <AccountGate />}
        />

        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={isSignedIn() ? <UserDashboard /> : <Navigate to="/account" replace />}
        />
        <Route path="/report/edit/:id" element={<EditReport />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}


