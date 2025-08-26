import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import "../signup/Auth.css";

export default function ReportThanks(){
  const [params] = useSearchParams();
  const nav = useNavigate();
  const isSignedIn = !!localStorage.getItem("token");
  const id = params.get("id");

  return (
    <div className="phonescreen">
      <div className="brand-title">WatchTower</div>
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign:"center" }}>
          <h2>Thank you!</h2>
          <p className="auth-sub">Your report has been submitted.</p>
          <div className="actions-row" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={()=> nav("/live")}>
              View live reports
              <svg className="btn-arrow" viewBox="0 0 24 24"><path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            Or <Link to="/">go back home</Link>
          </p>
        </div>
      </div>
      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}