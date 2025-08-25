// mobile/app.config.ts
import { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "WatchTower Mobile",
  slug: "watchtower-mobile",
  scheme: "watchtower",
  extra: {
    API_BASE_URL: "http://192.168.1.50:5051", // Local setup for dev at home
    // If testing on a real phone on same Wi‑Fi, use your PC’s LAN IP: "http://192.168.x.x:5000"
  },
});