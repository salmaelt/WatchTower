import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import "../signup/Auth.css";
import { loginUser } from "../../api/watchtowerApi";
import { useAuth } from "../../api/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, setToken } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignedIn = !!token;

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = {
      usernameOrEmail: e.target.email.value,
      password: e.target.password.value,
    };

    try {
      const result = await loginUser(formData);
      console.log("API response:", result);
      
      // Store token in AuthContext and localStorage
      // Set token immediately so route guards see it synchronously
      localStorage.setItem("token", result.token);
      setToken(result.token);
      // Also store username for immediate greeting
      localStorage.setItem("username", result.username);
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phonescreen">
      <BottomNavBar isSignedIn={isSignedIn} />
      <div className="brand-title">WatchTower</div>
      <div className="auth-wrap">
        <form className="auth-card" onSubmit={handleLogin}>
          <h2>Sign in</h2>
          <p className="auth-sub">Welcome back — please enter your details.</p>
          
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
            <label className="label" htmlFor="email">Email</label>
            <input 
              className="input" 
              id="email" 
              name="email" 
              type="email" 
              required 
              placeholder="you@example.com" 
              disabled={loading}
            />
          </div>
          
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input 
              className="input" 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              disabled={loading}
            />
          </div>
          
          <div className="actions-row">
            <button 
              type="submit" 
              className="btn-primary" 
              aria-label="Sign in"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && (
                <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          
          <p className="muted">
            No account? <Link to="/signup">Create one →</Link>
          </p>
          <div className="bottom-pad" />
        </form>
      </div>
    </div>
  );
}