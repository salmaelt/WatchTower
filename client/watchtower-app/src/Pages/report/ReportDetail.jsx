import "../../App.css";
import "./Report.css";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import { useAuth } from "../../api/AuthContext";
import { getReport } from "../../api/reports";
import { getComments, addComment } from "../../api/comments";

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isSignedIn = !!(token || localStorage.getItem("token"));

  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const authToken = token || localStorage.getItem("token");
        const r = await getReport(id, authToken);
        const c = await getComments(id, authToken);
        if (!cancelled) {
          setReport(r);
          setComments(Array.isArray(c) ? c : (c?.items || []));
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load report or comments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isSignedIn) {
      navigate("/signin");
      return;
    }
    const text = newComment.trim();
    if (!text) return;
    try {
      const authToken = token || localStorage.getItem("token");
      const created = await addComment(id, text, authToken);
      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (e) {
      setError(e?.title || e?.error || "Failed to add comment");
    }
  }

  return (
    <div className="phonescreen">
      <BottomNavBar isSignedIn={isSignedIn} />
      <div className="report-wrap">
        <button className="map-btn" onClick={() => navigate(-1)} style={{ alignSelf: "flex-start", marginBottom: 12 }}>
          ← Back
        </button>
        <h2>Report Details</h2>

        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}

        {report && (
          <div className="recent-item" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720, margin: "0 auto" }}>
            <div className="ri-title">{report.description}</div>
            <div className="ri-meta">
              {new Date(report.time || report.createdAt || report.occurredAt).toLocaleString()} · {report.locationText || (report.lat && report.lng ? `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}` : "")}
            </div>
            {typeof report.upvotes === "number" && (
              <div className="ri-meta" aria-label="Total upvotes">Upvotes: {report.upvotes}</div>
            )}
          </div>
        )}

        <section className="form-list" style={{ width: "100%", marginTop: 16 }}>
          <div style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
            <h3>Comments</h3>
            {comments.length === 0 && !loading && <p className="muted">No comments yet. Be the first to comment.</p>}

            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, margin: "8px auto 16px", maxWidth: 720 }}>
              <input
                type="text"
                placeholder={isSignedIn ? "Write a comment…" : "Sign in to comment"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!isSignedIn}
                style={{ flex: 1 }}
              />
              <button
                className="map-btn"
                type="submit"
                disabled={!isSignedIn || !newComment.trim()}
                style={{ flex: "0 0 auto", width: "auto", whiteSpace: "nowrap", padding: "8px 12px" }}
              >
                Post
              </button>
            </form>

            <div className="recent-list">
              {comments.map((c) => (
                <div key={c.id} className="recent-item" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="ri-meta">
                    <strong>{c.user?.username || "User"}</strong> · {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div>{c.commentText || c.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

