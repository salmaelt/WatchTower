import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar"
import "./UserProfile.css";

export default function UserProfile(){
  const navigate = useNavigate();

  //storing sign in token
  const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem("token"));

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setSignedIn(false); //if not signed in then change to sign out
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

  return (
    <div className="phonescreen">
      <div className="brand-title">WatchTower</div>

      <div className="dash-wrap">
        <div className="dash-header">
          <h2>Dashboard</h2>
          <p className="muted">
            {signedIn ? "Welcome back! Manage your reports and account." : "You’re signed out. Sign in to see your reports."}
          </p>
        </div>

        <div className="dash-grid">
          <section className="dash-card">
            <h3>My reports</h3>
            {signedIn ? (
              <>
                <p className="muted">You haven’t submitted any reports yet.</p>
                <button className="btn-primary" onClick={() => navigate("/report")}>
                  Report now
                  <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <p className="muted">Sign in to create and view your reports.</p>
                <button className="btn-primary" onClick={handleSignIn}>
                  Sign in
                  <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
          </section>

          <section className="dash-card">
            <h3>Account</h3>
            <div className="dash-row">
              <span>Status</span>
              <strong style={{ color: "#2f6b57" }}>{signedIn ? "Signed in" : "Signed out"}</strong>
            </div>

            <div className="dash-actions">
              {signedIn ? (
                <button className="btn-ghost" onClick={handleSignOut}>Sign out</button>
              ) : (
                <button className="btn-ghost" onClick={handleSignIn}>Sign in</button>
              )}
            </div>
          </section>
        </div>

        <div className="bottom-pad" />
      </div>

      <BottomNavBar isSignedIn={signedIn} />
    </div>
  );
}