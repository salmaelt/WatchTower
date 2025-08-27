import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import { getReports, updateReport, deleteReport } from "../../store/reports";
import "./UserProfile.css";

export default function UserProfile() {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();
  const [myReports, setMyReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    setMyReports(getReports().filter(r => r.user === username));
    setAllReports(getReports());
  }, [username]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setSignedIn(false);
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

  function handleDelete(id) {
    deleteReport(id);
    setMyReports(myReports.filter(r => r.id !== id));
    setAllReports(allReports.filter(r => r.id !== id));
  }

  function handleEdit(id) {
    navigate(`/report/edit/${id}`);
  }

  return (
    <div className="phonescreen">
       <BottomNavBar isSignedIn={signedIn} />
      <div className="brand-title"></div>

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
                {myReports.length === 0 ? (
                  <p className="muted">You haven’t submitted any reports yet.</p>
                ) : (
                  myReports.map(report => (
                    <div key={report.id} className="userprofile-report-item">
                      <div><b>Description:</b> {report.description}</div>
                      <div><b>Location:</b> {report.locationText}</div>
                      <div><b>Time:</b> {report.time}</div>
                      <button className="edit-btn" onClick={() => handleEdit(report.id)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(report.id)}>Delete</button>
                    </div>
                  ))
                )}
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

     
    </div>
  );
}