import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Location from "./leaflet/Location";
import './App.css'

import Homepage from './Pages/Homepage';
import Signup from './Pages/Signup';
import FourthPage from './Pages/UserProfile';
import FifthPage from "./Pages/FifthPage"
import Login from './Pages/LoginPage';

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


