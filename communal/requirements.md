# Requirements

## MVP

### Interactive Map
- Map dynamically loads markers within the current bounding box (only relevant markers visible).
- Markers are clickable and open a pop-up with detailed report information.

### Filtering
- Users can filter markers by categories (e.g., type of theft, date range, severity).

### User Accounts & Reporting
- Users can register/sign in securely (basic authentication system).
- Logged-in users can submit new reports by clicking a location on the map.
- Report form includes fields like type of theft, date/time, description, and an optional photo upload.

### Data Handling
- Reports are stored in a database with geospatial coordinates.
- Backend serves filtered data via API endpoints (JSON/GeoJSON).


## Stretch Goals

### External Integrations
- Pull external data (e.g., police crime reports API) and merge with user reports.
- Visual differentiation of official vs user-submitted data (different marker styles).

### User Features
- Ability to comment or upvote reports (community validation).
- User profile with a list/history of submitted reports.

### Map Usability
- Clustering of markers to reduce visual clutter at higher zoom levels.
- Smooth transition of clusters breaking into individual points.

### Geospatial Enhancements
- Use PostGIS for efficient geospatial queries.
- Serve GeoJSON for frontend mapping.
- Draw polygons for boroughs or districts, used for categorisation and filtering.

### External Integrations
- Pull external data (e.g., police crime reports API) and merge with user reports.
- Visual differentiation of official vs user-submitted data (different marker styles).


### User Features
- Ability to comment or upvote reports (community validation).
- User profile with a list/history of submitted reports.
