# Endpoints

## Auth
- **POST** `/auth/register`
  - body: `{ username, password }`
  - returns: `{ id, username, token }`

- **POST** `/auth/login`
  - body: `{ username, password }`
  - returns: `{ token }`

## Reports
- **GET** `/reports`
  - query params:
    - `bbox=minLng,minLat,maxLng,maxLat`
    - `type=...` (optional, repeatable)
    - `from=YYYY-MM-DD` (optional)
    - `to=YYYY-MM-DD` (optional)
  - returns: GeoJSON FeatureCollection of reports

- **POST** `/reports` (auth required)
  - body: `{ type, description, occurred_at, location: { lat, lng } }`
  - returns: `{ id, status }`

- **GET** `/reports/{id}`
  - returns: `{ id, user, type, description, occurred_at, location, status, upvotes, created_at }`

- **PATCH** `/reports/{id}/upvote` (auth required)
  - returns: `{ id, upvotes }`

## Comments
- **GET** `/reports/{id}/comments`
  - returns: `[ { id, user, comment_text, created_at } ]`

- **POST** `/reports/{id}/comments` (auth required)
  - body: `{ comment_text }`
  - returns: `{ id, user, comment_text, created_at }`