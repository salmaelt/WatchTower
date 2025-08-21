import { useNavigate, Link } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";

//here we need to add out actual authentication from the backend so it can do login/signup decisions

export default function AccountGate() {
  const navigate = useNavigate();
  const isSignedIn = !!localStorage.getItem("token"); 

  return (
    <div className="phonescreen" style={{ position:"relative", background:"#fff" }}>
      <div style={{ padding:"24px", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <h2>User</h2>
        <p style={{ color:"#6b7280" }}>You’re not signed in yet.</p>
        <button onClick={() => navigate("/signin")} className="report-btn">
          Sign in
          <svg className="arrow" viewBox="0 0 24 24"><path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <p style={{ marginTop:8 }}>No account? <Link to="/signup">Create one →</Link></p>
      </div>
      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}