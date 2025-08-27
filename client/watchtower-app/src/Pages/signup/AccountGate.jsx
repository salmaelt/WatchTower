import { useNavigate, Link } from "react-router-dom";
import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import phoneimage from "../../img/paletteBackground.png"
import { useAuth } from "../../api/AuthContext";

//here we need to add out actual authentication from the backend so it can do login/signup decisions

export default function AccountGate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isSignedIn = !!token; 

  return (
    <div className="phonescreen" style={{
      position: "relative", background: "#fff",
      background: `url(${phoneimage}) center/cover no-repeat`,
        minHeight: "100vh"
    }}>
      <BottomNavBar isSignedIn={isSignedIn} />
      <div style={{ padding:"24px", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16  }}>
        <h2>Account</h2>
        <p style={{ color:"white" , fontSize:"30px"}}>You’re not signed in yet.</p>
        <button onClick={() => navigate("/signin")} className="report-btn">
          Sign in
          <svg className="arrow" viewBox="0 0 24 24"><path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <p style={{ marginTop:8 , color:"white"}}>No account? <Link to="/signup">Create one →</Link></p>
      </div>
      
    </div>
  );
}