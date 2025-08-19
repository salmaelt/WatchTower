# WatchTower API Contracts (MVP)
# (NOT YET FINALISED!!!)
This document defines the HTTP contracts (URLs, methods, auth, request/response bodies, status codes, and examples) for the MVP endpoints.

## Conventions

- **Base URL:** `/` (e.g., `https://api.local/`)
- **Auth:** Bearer JWT in Authorization header for protected routes
- **Time:** `timestamptz` in ISO 8601 (UTC recommended)
- **GeoJSON coordinates:** `[lng, lat]`
- **Errors:** RFC7807 `application/problem+json` (ProblemDetails)

---

## Auth

### POST `/auth/register`
- Create a new user account.
- **Auth:** Not required
- **Request:**
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "username": "alice",
      "email": "alice@example.com",
      "password": "P@ssw0rd!!"
    }
    ```
- **Response 201:**
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "id": 42,
      "username": "alice",
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
    ```
- **Errors:**
  - 400 validation
  - 409 username/email taken

### POST `/auth/login`
- Exchange credentials for a JWT.
- **Auth:** Not required
- **Request:**
  - Body:
    ```json
    {
      "usernameOrEmail": "alice@example.com",
      "password": "P@ssw0rd!!"
    }
    ```
- **Response 200:**
  - Body:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "id": 42,
      "username": "alice"
    }
    ```
- **Errors:**
  - 400 validation
  - 401 invalid credentials

---

## Reports

### GET `/reports`
- Return markers in GeoJSON within a bounding box, with optional filters.
- **Auth:** Not required
- **Query params:**
  - `bbox=minLng,minLat,maxLng,maxLat` (required)
  - `type=...` (repeatable)
  - `from=YYYY-MM-DD` (inclusive, occurredAt)
  - `to=YYYY-MM-DD` (inclusive, occurredAt)
- **Response 200:**
  - Content-Type: `application/json; GeoJSON FeatureCollection`
  - Body:
    ```json
    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": { "type": "Point", "coordinates": [-0.1195, 51.5033] },
          "properties": {
            "id": 123,
            "type": "phone_theft",
            "occurredAt": "2025-08-18T20:14:00Z",
            "status": "open",
            "upvotes": 5
          }
        }
      ]
    }
    ```
- **Errors:**
  - 400 invalid bbox/filters
- **Notes:**
  - Geometry uses WGS84 (SRID 4326).
  - Use server-side spatial index for efficient queries.

### POST `/reports`
- Create a new report.
- **Auth:** Required (Authorization: Bearer `<token>`)
- **Request:**
  - Body:
    ```json
    {
      "type": "phone_theft",
      "description": "Snatched near the station.",
      "occurredAt": "2025-08-18T20:14:00Z",
      "lat": 51.5033,
      "lng": -0.1195
    }
    ```
- **Response 201:**
  - Body:
    ```json
    {
      "id": 123,
      "status": "open"
    }
    ```
- **Headers:**
  - Location: `/reports/123`
- **Errors:**
  - 400 validation
  - 401 unauthorized

### GET `/reports/{id}`
- Get full details for a specific report.
- **Auth:** Not required
- **Response 200:**
  - Body:
    ```json
    {
      "id": 123,
      "type": "phone_theft",
      "occurredAt": "2025-08-18T20:14:00Z",
      "lat": 51.5033,
      "lng": -0.1195,
      "status": "open",
      "upvotes": 5,
      "description": "Snatched near the station.",
      "userId": 42,
      "username": "alice",
      "createdAt": "2025-08-19T10:22:31Z"
    }
    ```
- **Errors:**
  - 404 not found

### PATCH `/reports/{id}/upvote`
- Increment upvote counter for a report.
- **Auth:** Required
- **Request:** (no body)
- **Response 200:**
  - Body:
    ```json
    {
      "id": 123,
      "upvotes": 6
    }
    ```
- **Errors:**
  - 401 unauthorized
  - 404 not found
  - 409 (optional) double‑voting guard if implemented later

---

## Comments

### GET `/reports/{id}/comments`
- List comments for a report (newest first is fine for MVP).
- **Auth:** Not required
- **Response 200:**
  - Body:
    ```json
    [
      {
        "id": 555,
        "userId": 42,
        "username": "alice",
        "commentText": "I saw this too around 8:15.",
        "createdAt": "2025-08-19T10:25:10Z"
      }
    ]
    ```
- **Errors:**
  - 404 if report not found
- **Optional (future):**
  - Pagination: `?page=1&pageSize=50`

### POST `/reports/{id}/comments`
- Add a comment to a report.
- **Auth:** Required
- **Request:**
  - Body:
    ```json
    {
      "commentText": "Camera at the shop might have footage."
    }
    ```
- **Response 201:**
  - Body:
    ```json
    {
      "id": 556,
      "userId": 42,
      "username": "alice",
      "commentText": "Camera at the shop might have footage.",
      "createdAt": "2025-08-19T10:26:00Z"
    }
    ```
- **Errors:**
  - 400 validation
  - 401 unauthorized
  - 404 report not found

---

## Error Shape (all endpoints)

### ProblemDetails (example)
- Content-Type: `application/problem+json`
- Body:
  ```json
  {
    "type": "https://httpstatuses.com/400",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-6f0c3c5b8c9f7a9d..."
  }
  ```
- For model validation errors, ASP.NET Core may include an `errors` object.