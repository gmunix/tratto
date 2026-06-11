# Backend Plan

## Principles

- Keep PRs small and independently reviewable.
- Use SQLite and raw SQL for now.
- Add tests for domain rules and routes as backend grows.
- Prefer simple REST endpoints; no realtime requirement yet.
- Express 5 can route async errors to error middleware, but handlers should still be small and explicit.

## Required Tables

### users

- `id TEXT PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `password_hash TEXT NOT NULL`
- `display_name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE COLLATE NOCASE`
- `avatar_url TEXT`
- `theme TEXT NOT NULL DEFAULT 'grime' CHECK (theme IN ('grime', 'cassete'))`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

### sessions or auth_tokens

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `token_hash TEXT NOT NULL UNIQUE`
- `expires_at TEXT NOT NULL`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

### communities

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE COLLATE NOCASE`
- `description TEXT`
- `privacy TEXT NOT NULL CHECK (privacy IN ('public', 'private'))`
- `creator_id TEXT NOT NULL REFERENCES users(id)`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

### community_memberships

- `id TEXT PRIMARY KEY`
- `community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE`
- `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `role TEXT NOT NULL CHECK (role IN ('creator', 'admin', 'member'))`
- `status TEXT NOT NULL CHECK (status IN ('pending', 'member', 'denied', 'removed'))`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `UNIQUE (community_id, user_id)`

### trattos

Add or confirm:

- `creator_id TEXT NOT NULL REFERENCES users(id)`
- `community_id TEXT REFERENCES communities(id) ON DELETE SET NULL`
- `rules_json TEXT NOT NULL DEFAULT '[]'`
- Keep existing case number, status, decision method, deadline, consequence.

### tratto_participants

Move from display-name-only to user-aware participants:

- `user_id TEXT REFERENCES users(id) ON DELETE SET NULL`
- `display_name TEXT NOT NULL`
- `role TEXT CHECK ('creator', 'participant', 'judge')`
- `invite_status TEXT CHECK ('pending', 'accepted', 'declined')`

### evidences

Keep existing and extend:

- `author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL`
- `type TEXT CHECK ('text', 'image', 'link', 'file')`
- `content TEXT NOT NULL`
- `metadata_json TEXT` for image/file details.

### notifications

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `type TEXT NOT NULL`
- `title TEXT NOT NULL`
- `body TEXT`
- `target_url TEXT`
- `read_at TEXT`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

## REST API Shape

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Current user:

- `PATCH /api/me`
- `PATCH /api/me/theme`

Trattos:

- `GET /api/trattos`
- `POST /api/trattos`
- `GET /api/trattos/:id`
- `POST /api/trattos/:id/evidences`
- `POST /api/trattos/:id/request-judgment`
- `POST /api/trattos/:id/votes`

Communities:

- `GET /api/communities?query=`
- `POST /api/communities`
- `GET /api/communities/:slug`
- `PATCH /api/communities/:slug`
- `POST /api/communities/:slug/join`
- `POST /api/communities/:slug/requests/:requestId/approve`
- `POST /api/communities/:slug/requests/:requestId/deny`

Notifications:

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Lookup:

- `GET /api/users?query=` for slug/name search.

## Backend PR Sequence Into `feat/backend`

1. `backend/schema-users-auth`: users, auth token table, seed users, tests for unique slug/email.
2. `backend/auth-routes`: register/login/logout/me middleware and route tests.
3. `backend/schema-communities`: communities and memberships with seed data and tests.
4. `backend/trattos-api`: list/detail/create Trattos using authenticated user and optional community.
5. `backend/evidence-notifications`: evidence creation, notification table, notification routes.
6. `backend/community-actions`: join/request/approve/deny and permission tests.
7. `backend/frontend-integration`: frontend API client, environment config, replace selected mock flows carefully.

Each PR should target `feat/backend`, not `main`.

## Test Expectations

- Add a real backend test runner before route work.
- Prefer Node's built-in test runner plus `supertest` if minimal.
- Test migrations/seeds, route success paths, validation failures, and permission failures.
