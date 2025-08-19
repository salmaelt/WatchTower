# WatchTower API Contracts (MVP)

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
- Create a new user account and return an access token.
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
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
    ```
- **Errors:**
  - 400 validation (e.g no @ symbol in usernames)
  - 409 username/email taken
---

### POST `/auth/login`
- Exchange credentials for a short-lived access token. 
- **Auth:** Not required
- **Request:**
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
      "tokenType": "Bearer",
      "expiresIn": 3600,
      "id": 42,
      "username": "alice"
    }
    ```
- **Errors:**
  - 400 validation
  - 401 invalid credentials
- **Notes**
  - Logging out must be done client side, drop token, and remove info from LocalStorage
---

### DELETE `/auth/me`
- Delete the authenticated user’s account.
- **Auth**: Required
- **Request**: (no body)
- **Response 204**: (No Content)
- **Errors**:
    - 401 unauthorized
- **Notes**:
    - On successful deletion, all owned resources are removed via cascading delete: the user’s reports (and their comments & upvotes), the user’s comments on other reports, and the user’s upvotes.

## Reports

### GET `/reports` (GeoJSON)
- Return markers in GeoJSON within a bounding box, with optional filters.
- **Auth:** Not required (If unauthenticated, `upvotedByMe` is defaulted to false, if authenticated it reflects the logged-in user)
- **Content-Type:** `application/geo+json`
- **Query params:**
  - `bbox=minLng,minLat,maxLng,maxLat` (required)
  - `type=...` (repeatable)
  - `from=YYYY-MM-DD` (inclusive, occurredAt)
  - `to=YYYY-MM-DD` (inclusive, occurredAt)
- **Response 200:**
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
                "createdAt": "2025-08-19T10:22:31Z",   
                "updatedAt": "2025-08-19T12:05:00Z", 
                "status": "open",
                "upvotes": 5,
                "upvotedByMe": false,
                "description": "Snatched near the station.",
                "user": { "id": 42, "username": "alice" }
            }
        }, ...
      ]
    }
    ```
- **Errors:**
  - 400 invalid bbox/filters
- **Notes:**
  - Geometry uses WGS84 (SRID 4326).
  - Uses server-side spatial index for efficient queries.
  - `updatedAt` may be `null` if never edited
---

### GET `/reports/{id}` (GeoJSON)
- Get full details for a specific report.
- **Auth:** Not required (If unauthenticated, `upvotedByMe` is defaulted to false, if authenticated it reflects the logged-in user)
- **Content-Type:** `application/geo+json`
- **Response 200:**
  - Body:
    ```json
    {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [-0.1195, 51.5033] },
        "properties": {
            "id": 123,
            "type": "phone_theft",
            "occurredAt": "2025-08-18T20:14:00Z",
            "createdAt": "2025-08-19T10:22:31Z",
            "updatedAt": "2025-08-19T12:05:00Z",
            "status": "open",
            "upvotes": 5,
            "upvotedByMe": false,
            "description": "Snatched near the station.",
            "user": { "id": 42, "username": "alice" }
        }
    }
    ```
- **Errors:**
  - 404 not found
- **Notes:**
  - Geometry uses WGS84 (SRID 4326).
  - `updatedAt` may be `null` if never edited
---

### POST `/reports`
- Create a new report, created at time is handled by backend, just pass in when the theft happened.
- **Auth:** Required (Authorization: Bearer `<token>`), this is used to infer the user.
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
- **Response 201**:
  - Body:
    ```json
    {
      "id": 123,
      "status": "open",
      "createdAt": "2025-08-19T10:22:31Z",
      "updatedAt": null
    }
    ```
  - **Response Headers:**
    - `Location: /reports/{id}`
- **Errors**:
  - 400 validation
  - 401 unauthorized
---

### PATCH `/reports/{id}` 
- Update the description to add new information.
- **Auth**: Required (owner or admin)
- **Request**:
    - Body:
    ```json
    {
      "description": "Updated description to add more detail."
    }
    ```
- **Response 200**:
    - Body:
    ```json
    {
      "id": 123,
      "updatedAt": "2025-08-19T12:30:00Z"
    }
    ```
- **Errors**: 
    - 400 validation
    - 401 unauthorized
    - 403 forbidden
    - 404 not found
---

### PUT `/reports/{id}/upvote`
- Upvote a post, once per user per report, and users cannot upvote their own posts, idempotent.
- **Auth:** Required
- **Request:** (no body)
- **Response 200:**
  - Body:
    ```json
    {
      "id": 123,
      "upvotes": 6,
      "upvotedByMe": true
    }
    ```
- **Errors:**
  - 400 self-upvote
  - 401 unauthorized
  - 404 not found
- **Notes:**
    - This call is idempotent, if the post is already upvoted, no operation will occur.
---

### DELETE `/reports/{id}/upvote`
- Remove an upvote on a report, once per user, per report, idempotent.
- **Auth:** Required
- **Request:** (no body)
- **Response 200:**
  - Body:
    ```json
    {
      "id": 123,
      "upvotes": 5,
      "upvotedByMe": false
    }
    ```
- **Errors:**
  - 400 self
  - 401 unauthorized
  - 404 not found
- **Notes:**
    - This call is idempotent, returns 200 even if the post is not upvoted (in this case no operation will occur).
---

### DELETE `/reports/{id}`
- Delete a report (as the owner or an admin)
- **Auth:** Required
- **Request:** (no body)
- **Response 204 (No Content)**: (no body)
- **Errors:**
  - 401 unauthorized
  - 403 forbidden
  - 404 not found
- **Notes:**
    - Causes a cascading delete of all related comments/upvotes.

## Comments

### GET `/reports/{id}/comments`
- List comments for a report (newest first).
- **Auth:** Not required. If unauthenticated, upvotedByMe is always false; if authenticated, it reflects the caller.
- **Request**: (no body)
- **Response 200:**
  - Body:
  ```json
  [
    {
      "id": 555,
      "userId": 42,
      "username": "alice",
      "commentText": "I saw this too around 8:15.",
      "createdAt": "2025-08-19T10:25:10Z",
      "upvotes": 3,
      "upvotedByMe": false
    }, ...
  ]
  ```
- **Errors:**
  - 404 report not found
- **Notes:**
  - Returns `200` with an **empty array** if there are no comments.
  - If the request is **unauthenticated**, `upvotedByMe` will always be false

---

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
    "createdAt": "2025-08-19T10:26:00Z",
    "upvotes": 0,
    "upvotedByMe": false
  }
  ```
- **Errors:**
  - 400 validation
  - 401 unauthorized
  - 404 report not found

---

### PUT `/comments/{id}/upvote`
- Upvote comment — set “upvoted by me” = **true** (idempotent). Blocks self-upvote.
- **Auth:** Required
- **Request:** (no body)
- **Response 200:**
  - Body: 
  ```json
  { 
    "id": 556,
    "upvotes": 4,
    "upvotedByMe": true 
  }
  ```
- **Errors:**
  - 400 self-upvote not allowed
  - 401 unauthorized
  - 404 comment not found
- **Notes:**
  - Idempotent: if you already upvoted, returns `200` with the same state.

---

### DELETE `/comments/{id}/upvote`
- Remove upvote (aka 'downvote comment') — set “upvoted by me” = **false** (idempotent; no-op if not upvoted).
- **Auth:** Required
- **Request:** (no body)
- **Response 200:**
  - Body:
  ```json
  {
    "id": 556,
    "upvotes": 3,
    "upvotedByMe": false
  }
  ```
- **Errors:**
  - 401 unauthorized
  - 404 comment not found
- **Notes:**
  - Returns `200` even if you hadn’t upvoted; state remains unchanged.

### DELETE `/comments/{id}`
- Delete a comment as an owner
- **Auth:** Required
- **Request:** (no body)
- **Response 204:** (no content)
- **Errors:**
  - 401 unauthorized
  - 404 comment not found



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