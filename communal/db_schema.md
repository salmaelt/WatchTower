# DB Schema

## Users
- **id**: BIGINT PK — Primary key
- **username**: TEXT — Unique username
- **password_hash**: TEXT — Hashed password
- **is_admin**: BOOLEAN — Is the user an admin?
- **created_at**: TIMESTAMPTZ — When the user was created

## Reports
- **id**: BIGINT PK — Primary key
- **user_id**: BIGINT FK → users(id) — Reporter user ID
- **type**: TEXT — Type of report
- **description**: TEXT — Description of the report
- **occurred_at**: TIMESTAMPTZ — When the event occurred
- **location**: geometry(Point, 4326) — Geographic location
- **status**: TEXT — Report status
- **created_at**: TIMESTAMPTZ — When the report was created
- **upvotes**: INTEGER DEFAULT 0 — Total number of upvotes

## Comments
- **id**: BIGINT PK — Primary key
- **report_id**: BIGINT FK → reports(id) — The report being commented on
- **user_id**: BIGINT FK → users(id) — The user who made the comment
- **comment_text**: TEXT — Text of the comment
- **created_at**: TIMESTAMPTZ — When the comment was created

