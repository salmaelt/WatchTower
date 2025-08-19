# Layered Backend

A practical plan for **watchtower-api** built with ASP.NET Core, EF Core, PostgreSQL + PostGIS. Three layer backend plus database.

---

## Controller Layer

**Role:** HTTP boundary. Accept request DTOs, validate, call repositories/services, map to response DTOs (or GeoJSON), return proper status codes.

**What lives here**
- **DTOs (Contracts)**
  - `RegisterRequest`, `LoginRequest`, `AuthResponse`
  - `CreateReportRequest { Type, Description, OccurredAt, Lat, Lng }`
  - `ReportSummaryDto`, `ReportDetailDto`
  - `CreateCommentRequest`, `CommentDto`
  - `GeoJsonFeature`, `GeoJsonFeatureCollection` (for map)
- **Mapping:** DTO ↔ Domain (e.g., Lat/Lng → `Point` SRID 4326).
- **Validation:** required fields, allowed `Type` values, sane dates, etc.
- **Auth:** `[Authorize]` on protected routes; extract user id from JWT.
- **Filtering & Paging:**  
  `GET /reports?bbox=...&type=...&from=...&to=...&page=1&pageSize=200`
- **Responses:**
  - `201 Created` with `{ id }` for POSTs
  - `200 OK` for reads (lists, detail, GeoJSON)
  - `400/401/403/404` as appropriate

---

## Model Layer

**Role:** EF Core **domain entities** + optional domain behavior.

**Entities**
- `User { Id, Username, PasswordHash, IsAdmin, CreatedAt, ICollection<Report>, ICollection<Comment> }`
- `Report { Id, UserId, User, Type, Description, OccurredAt, Point Location(4326), Status, CreatedAt, Upvotes }`
- `Comment { Id, ReportId, Report, UserId, User, CommentText, CreatedAt }`

**Notes**
- Navigation properties are **not DB columns**; they model relationships in code.
- Prefer `ICollection<>` with `HashSet<>` backing for flexibility and no duplicates.
- Keep **behavior** close to data when helpful (e.g., `Report.Upvote()`).

**Serialization**
- Don’t return entities directly. **Map to DTOs** to avoid cycles/overfetching.

---
## Repository Layer (EF Core)

**Role:** Data access + querying (including spatial) behind interfaces.

**Interfaces**
- `IUserRepository` → `GetByUsername`, `Add`, `GetById`
- `IReportRepository` → `GetAsync(filter, pagination)`, `GetById`, `Add`, `Upvote`
- `ICommentRepository` → `GetForReport`, `Add`

**Spatial querying**
- **BBox**: build polygon from `minLng,minLat,maxLng,maxLat`;  
  `WHERE r.Location.Intersects(bboxPolygon)` (SRID 4326).
- **Indexes**: use **GiST** on `reports.location`.

**Query practices**
- Use `AsNoTracking()` for read-only queries.
- Prefer **projections** to DTOs over heavy `Include(...)`.
- Wrap multi-step writes in transactions when needed.

**Return types**
- Repositories return **domain entities**; controllers map to DTOs/GeoJSON.

---

## Database

**Role:** PostgreSQL + PostGIS = source of truth.

**Schema**
- `users(id PK, username UNIQUE, password_hash, is_admin, created_at timestamptz)`
- `reports(id PK, user_id FK→users, type, description, occurred_at timestamptz, location geometry(Point,4326), status, created_at timestamptz, upvotes int default 0)`
- `comments(id PK, report_id FK→reports, user_id FK→users, comment_text, created_at timestamptz)`

**Extensions & Indexes**
- `CREATE EXTENSION IF NOT EXISTS postgis;`
- `CREATE UNIQUE INDEX users_username_idx ON users(username);`
- `CREATE INDEX reports_user_id_idx ON reports(user_id);`
- `CREATE INDEX comments_report_id_idx ON comments(report_id);`
- `CREATE INDEX reports_location_gist ON reports USING GIST(location);`  ← spatial

**Data types**
- Use `timestamptz` (UTC) for all timestamps.
- Store coordinates as `geometry(Point,4326)` and always set SRID.

**Migrations**
- First migration: create tables, FKs, indexes, and enable PostGIS.
- Neon-compatible connection string (with SSL).

How to Migrate the DB and setup EFCORE:
```bash
# from the API project folder
dotnet ef database drop -f
rm -rf Migrations
dotnet ef migrations add InitialCreate
dotnet ef database update
```