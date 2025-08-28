import React from "react";

export default function SafetyTips() {
  return (
    <footer style={{
      marginTop: 24,
      padding: "16px 20px",
      background: "#0f3d2e",
      color: "#e9fff4",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      position: "relative",
      zIndex: 5
    }}>
      <h4 style={{ margin: 0, fontSize: 16 }}>Stay safe out there</h4>
      <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.5 }}>
        <li>Be aware of your surroundings, especially near busy junctions and transport hubs.</li>
        <li>Keep phones zipped away when walking or cycling; avoid using near the curb.</li>
        <li>If a theft occurs, do not confront. Move to a safe place and contact authorities.</li>
        <li>Enable device tracking and remote‑wipe. Record your device IMEI/serial number.</li>
        <li>Report incidents promptly to help others avoid hotspots.</li>
      </ul>
    </footer>
  );
}


