# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

### Routing

` src/App.jsx` defines routes:

 - `/` → Location (Home map)
 - `/report` → Report
 - `/report/thanks` → ReportThanks
 - `/live` → LiveReports
 - `/user` or /profile → UserProfile
 - `/login` → Login
 - `/signup` → Signup

The BottomNavBar links to Home, Live, and User pages. “Report now” buttons from Home or Live link to /report.

## Reports/Report.jsx (Create a report)

- **Tap-to-pick**: Tap the map to pick a point (uses a small `ClickCapture` component via `useMapEvents`).
- **Form collects**:
  - Location *(optional text)*
  - Brief description 
  - Time of incident *(`datetime-local`)*
- **On submit**:
  - Validates that a map point was picked + description + time.
  - Calls `store/reports.addReport(...)`.
  - Navigates to `/report/thanks` with the new report ID
---

## Reports/ReportThanks.jsx
- Simple “Thank you” card with:
  -   View live reports button
  -   Back home link

--- 
### `signup/Login.jsx` & `signup/Signup.jsx`
- **UI:** Minimal forms with **grey inputs** and a **green primary** submit button.
- **Flow:** On success, navigate to **UserProfile**.
- **Backend:**
  - `POST /auth/login`
  - `POST /auth/register`

---

## Components

### `components/BottomNavBar/`
- **Layout:** Rounded, **floating** bottom navigation bar in WatchTower green.
- **Items:**  
  - **Home** (map)  
  - **Live** (live reports)  
  - **User** (profile / auth)
- **UX:** Active item highlighted; subtle hover/tap **“nudging”** animation via CSS.

---

## Hooks

### `hooks/GeoLocation.jsx`
- **Purpose:** Promise-based wrapper around `navigator.geolocation`.
- **Shape:**
  ```js
  {
    loaded: boolean,
    coordinates: { lat: number, lng: number } | null,
    accuracy: number | null,
    error: any | null
  }
