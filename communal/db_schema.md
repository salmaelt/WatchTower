# DB Schema

## Users
- **id**: BIGINT PK — Primary key
- **username**: TEXT — Unique username
- **email**: TEXT - User email address
- **password_hash**: TEXT — Hashed password
- **is_admin**: BOOLEAN — Is the user an admin?
- **created_at**: TIMESTAMPTZ — When the user was created

## Reports
- **id**: BIGINT PK — Primary key
- **user_id**: BIGINT FK → users(id) — Reporter user ID
- **type**: TEXT — Type of report
- **description**: TEXT — Description of the report
- **location**: geometry(Point, 4326) — Geographic location
- **status**: TEXT — Report status
- **occurred_at**: TIMESTAMPTZ — When the event occurred
- **created_at**: TIMESTAMPTZ — When the report was created
- **updated_at**: TIMESTAMPTZ — When the report was updated
- **upvotes**: INTEGER DEFAULT 0 — Total number of upvotes

## Report Upvotes
- report_id: BIGINT FK → reports(id) — Report being upvoted
- user_id: BIGINT FK → users(id) — User who upvoted
- created_at: TIMESTAMPTZ — When the upvote was created
- PRIMARY KEY (report_id, user_id) — Ensures one upvote per user per report, composes the two foreign keys above

## Comments
- **id**: BIGINT PK — Primary key
- **report_id**: BIGINT FK → reports(id) — The report being commented on
- **user_id**: BIGINT FK → users(id) — The user who made the comment
- **comment_text**: TEXT — Text of the comment
- **created_at**: TIMESTAMPTZ — When the comment was created

## Comment Upvotes
- comment_id: BIGINT FK → comments(id) — Comment being upvoted
- user_id: BIGINT FK → users(id) — User who upvoted
- created_at: TIMESTAMPTZ — When the upvote was created
- PRIMARY KEY (comment_id, user_id) — Ensures one upvote per user per comment, composes the two keys above


## ERD
![Erd diagram](erd3.png)
