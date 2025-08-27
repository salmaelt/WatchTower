# NECK-Ltd
# WatchTower Mobile — `src/` Overview

An app for reporting and viewing mobile-phone theft incidents. The app uses a **bottom navbar** layout (Home / Live / User), a **bounded London map** on Home, and a **Create Report** flow gaurded by authentication. Networking is via **Axios** against a .NET backend that returns **GeoJSON** for map rendering.

---

## Architecture

- **State & Auth**
  - `axios.defaults.baseURL` set from **Expo config** (`extra.API_BASE_URL`)
  - `Authorization: Bearer <token>` header set automatically after login/register

- **Navigation**
  - `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
  - Tabs: `MapTab`, `ReportsTab`, `ProfileTab`
  - Profile stack shows **AuthGate/Login/Register** when signed out, **Profile** when signed in
- **Data**
  - Reports fetched by **bounding box** → `GET /reports?bbox=minLng,minLat,maxLng,maxLat`
  - Reports created via `POST /reports` (auth) with `{ type, description, occurredAt, lat, lng }`
  - Comments/upvotes available (endpoints wrapped in `src/api/comments.ts` & `src/api/reports.ts`)
- **UI**
  - Consistent WatchTower theme via `src/theme/palette`
  - Reusable `LoadingButton` and `DismissKeyboard` components

---
## Auth flow

- `AuthContext.tsx`:
  - Reads `API_BASE_URL` from Expo config and sets `axios.defaults.baseURL`
  - On app start, **restores token** from SecureStore and sets `Authorization` header
  - `login(usernameOrEmail, password)` / `register(username, email, password)`:
    - `POST /auth/login` or `POST /auth/register`
    - Extract `{ token, id, username }` (supports `{ token, user: {id, username} }` too)
  - `logout()` clears SecureStore, removes header, resets context state
  - `requireAuth(navigation, redirect)` routes to **AuthGate** (or Login) if no token

**Navigation after success**: `LoginScreen` and `RegisterScreen` **reset** the navigator to `ProfileTab → Profile` to avoid staying in the auth stack:

---
## Screens & Navigation

### **MapScreen (Home)**
- Bounded map centered on London
- Header action: “+” **Create Report**
- If not signed in, prompts to log in (or uses `requireAuth`)

### **CreateReportScreen**
- Tap-to-pick map location
- Form fields: type / description / time
- Calls `createReport(...)`

### **ReportsListScreen**
- Loads `listReportsByBbox(...)` and displays features (list and/or pins)

### **ProfileScreen**
- Shows initials/name (from context or JWT claims)
- Actions: **Log out** (and optional **Delete account**)

### **AuthGateScreen**
- Friendly landing for signed-out users → **Sign in** or **Create account**

### **Login / Register**
- Validates inputs
- On success, reset to **ProfileTab → Profile**

---

## Theming
- Colors centralized in `src/theme/palette`:
  - `green` / `greenD` for buttons/nav
  - `ink` for headings/text
  - `bg` for screen backgrounds
- All major buttons use `LoadingButton` styled with WatchTower green

---
