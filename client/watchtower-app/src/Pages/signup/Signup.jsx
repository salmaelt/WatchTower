import { useNavigate, Link } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import "./Auth.css";

export default function Signup(){
  const navigate = useNavigate();
  const isSignedIn = !!localStorage.getItem("token");

  function handleSignup(e){
    e.preventDefault();
    // replace with actual api call later
    localStorage.setItem("token", "demo-token");
    navigate("/dashboard"); 
  }

  return (
    <div className="phonescreen">
      <div className="brand-title">WatchTower</div>

      <div className="auth-wrap">
        <form className="auth-card" onSubmit={handleSignup}>
          <h2>Create account</h2>
          <p className="auth-sub">Join the community and help deter phone theft.</p>

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
            <button type="submit" className="btn-primary" aria-label="Create account">
              Create account
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