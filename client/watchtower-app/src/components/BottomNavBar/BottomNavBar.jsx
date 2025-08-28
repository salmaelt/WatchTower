
import React from 'react';
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./BottomNavBar.css";
import { useAuth } from "../../api/AuthContext";

function HomeIcon(){return(<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" fill="currentColor"/></svg>)}
function LiveIcon(){return(<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm7-1a1 1 0 0 1 .8 1.6A9 9 0 0 1 4.2 17.4 1 1 0 1 1 3 16a11 11 0 0 0 18-8 1 1 0 0 1 1-1zM5 7a1 1 0 0 1 1.4-.2A9 9 0 0 1 19 17a1 1 0 1 1-1.2 1.6A11 11 0 0 0 5 8a1 1 0 0 1 0-1z" fill="currentColor"/></svg>)}
function UserIcon(){return(<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" fill="currentColor"/></svg>)}


export default function BottomNavBar({ isSignedIn: propSignedIn }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isSignedIn = propSignedIn !== undefined ? propSignedIn : !!token;

  function handleProfileClick() {
    if (!isSignedIn) {
      alert("Please log in to access your profile.");
      navigate('/signin');
    } else {
      navigate('/account');
    }
  }

  return (
    <nav className="topnav-container">
      <div className="topnav-brand" onClick={() => navigate('/')}>WatchTower</div>
      <div className="topnav-links">
        <button className="topnav-btn" onClick={() => navigate('/')}>Home</button>
        <button className="topnav-btn" onClick={() => navigate('/live')}>Live Reports</button>
        <button className="topnav-btn" onClick={() => navigate('/report')}>New Report</button>
        <button className="topnav-btn" onClick={handleProfileClick}>Profile</button>
        {!isSignedIn && (
          <button className="topnav-btn" onClick={() => navigate('/signin')}>Login</button>
        )}
      </div>
    </nav>
  );
}