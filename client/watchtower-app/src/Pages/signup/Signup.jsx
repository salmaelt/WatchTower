import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import "./Auth.css";
import phoneimage from "../../img/paletteBackground.png";
import { registerUser } from "../../api/watchtowerApi";
import { useAuth } from "../../api/AuthContext";


export default function Signup(){
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const isSignedIn = false;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e){
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = {
      username: e.target.name.value,
      email: e.target.email.value,
      password: e.target.password.value,
    };
    try {
      const result = await registerUser(formData);
      // Set token immediately so route guards see it synchronously
      localStorage.setItem("token", result.token);
      setToken(result.token);
      localStorage.setItem("username", result.username);
      navigate("/dashboard");
    } catch (err) {
      const isConflict = err?.status === 409;
      const validationMsg = err?.title || (err?.errors && Object.values(err.errors).flat()[0]);
      setError(
        isConflict
          ? "Account already exists. Try signing in instead."
          : validationMsg || "Signup failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phonescreen">
      <BottomNavBar isSignedIn={isSignedIn} />
      <div className="brand-title">WatchTower</div>

      <div className="auth-wrap">
        <form className="auth-card" onSubmit={handleSignup}>
          <h2>Create account</h2>
          <p className="auth-sub">Join the community and help deter phone theft.</p>

          {error && (
            <div className="error-message" style={{ 
              color: '#e74c3c', 
              backgroundColor: '#fdf2f2', 
              padding: '12px', 
              borderRadius: '4px', 
              marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="name">Full name</label>
            <input className="input" id="name" name="name" type="text" required placeholder="Alex Doe" />
          </div>

          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required placeholder="••••••••" />
          </div>

          <div className="actions-row">
            <button type="submit" className="btn-primary" aria-label="Create account" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
              <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <p className="muted">
            Already have an account? <Link to="/signin">Sign in →</Link>
          </p>

          <div className="bottom-pad" />
        </form>
      </div>

      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}