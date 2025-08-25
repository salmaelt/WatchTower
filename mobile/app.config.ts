// mobile/app.config.ts
import { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "WatchTower Mobile",
  slug: "watchtower-mobile",
  scheme: "watchtower",
  extra: {
    API_BASE_URL: "http://10.0.2.2:5000", // Android emulator -> host loopback
    // If testing on a real phone on same Wi‑Fi, use your PC’s LAN IP: "http://192.168.x.x:5000"
  },
});