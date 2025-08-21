import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

function Homepage() {
  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Welcome to Watchtower app</h1>
      <nav className="homepage-nav">
        <Link to="/signup" className="homepage-link">Signup Page</Link>
        <Link to="/userprofile" className="homepage-link">User Profile Page</Link>
        <Link to="/5" className="homepage-link">Fifth Page</Link>
      </nav>
    </div>
  );
}

export default Homepage;