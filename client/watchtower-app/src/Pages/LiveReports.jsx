import BottomNavBar from "../components/BottomNavBar/BottomNavBar";

export default function LiveReports({ title = "Live Reports (coming soon)" }) {
  const isSignedIn = !!localStorage.getItem("token");
  return (
    <div className="phonescreen" style={{ position:"relative", background:"#fff" }}>
      <h2 style={{ textAlign:"center", margin:"24px 0" }}>{title}</h2>
      <div style={{ padding:"16px", color:"#2f6b57" }}>
        <p>We’re building this now. You’ll see live incidents here soon.</p>
      </div>
      <BottomNavBar isSignedIn={isSignedIn} />
    </div>
  );
}