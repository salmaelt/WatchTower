import { useNavigate, Link } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import "../signup/Auth.css";
import { useAuth } from "../../api/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const isSignedIn = !!token;

  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const usernameOrEmail = form.email.value.trim();
    const password = form.password.value;
    try {
      await login(usernameOrEmail, password);
      console.log("Login successful");
      navigate("/dashboard");
    } catch (err) {
      console.log("Login unsuccessful", err);
      alert(err?.error || "Login failed");
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
          <div className="field">
            <label className="label" htmlFor="email">Email or Username</label>
            <input className="input" id="email" name="email" type="text" required placeholder="you@example.com or username" />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <div className="actions-row">
            <button type="submit" className="btn-primary" aria-label="Sign in">
              Sign in
              <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="muted">
            No account? <Link to="/signup">Create one →</Link>
          </p>
          <div className="bottom-pad" />
        </form>
      </div>
      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}