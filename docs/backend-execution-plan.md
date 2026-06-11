# Backend Execution Plan

## Current State Reviewed

- Backend stack: Node.js, Express 5, SQLite through `better-sqlite3`, ESM modules, raw SQL migrations.
- Backend route surface today: only `GET /api/health` wired through `src/routes/index.js`.
- Database today: `database/migrations/001_init.sql` creates `trattos`, `tratto_participants`, `evidences`, `comments`, `votes`, and `tratto_verdicts`.
- Seed data today: `database/seeds/development.sql` inserts five Trattos and related participants, evidence, one comment, and two verdicts.
- Identity today: no `users` table, no auth, no slugs, and Tratto participants/evidence authors are display-name based.
- Scripts today: `db:migrate`, `db:seed`, `db:reset`, `dev`, `start`, `lint`, `format`; `test` is still a placeholder.
- Frontend mock data today: `frontend/src/data/mockTrattos.js` uses flat Tratto objects with `participants: string[]`, `rules: string`, `evidence[].author`, and a mock `currentUser` with `username` instead of `slug`.
- Frontend API client today: `frontend/src/services/api.js` is an Axios instance with no auth interceptor yet.

## Target Backend Shape

- Authentication is required before app data routes are useful.
- Use bearer tokens stored server-side as hashed tokens in SQLite.
- Keep REST routes under `/api`.
- Use SQLite migrations only; do not rewrite `001_init.sql` after it has shipped.
- Add normalized users, slugs, communities, memberships, invitations, notifications, and user-aware Tratto relationships.
- Preserve mock-friendly response shapes where possible so frontend migration is incremental.

## Schema Plan

### Migration 002: Users And Auth Tokens

Create `users`:

- `id TEXT PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE COLLATE NOCASE`
- `password_hash TEXT NOT NULL`
- `display_name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE COLLATE NOCASE`
- `avatar_url TEXT`
- `theme TEXT NOT NULL DEFAULT 'grime' CHECK (theme IN ('grime', 'cassete'))`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

Create `auth_tokens`:

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `token_hash TEXT NOT NULL UNIQUE`
- `expires_at TEXT NOT NULL`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `last_used_at TEXT`

Indexes:

- `idx_auth_tokens_user_id` on `auth_tokens(user_id)`
- `idx_auth_tokens_expires_at` on `auth_tokens(expires_at)`

Implementation notes:

- Use Node `crypto.randomBytes` for token generation.
- Store only SHA-256 token hashes.
- Add `AUTH_TOKEN_TTL_DAYS` to environment with a development default.
- Use `bcrypt` or `argon2` for `password_hash`; choose `bcrypt` if native install friction is lower for this class project.

### Migration 003: Communities And Memberships

Create `communities`:

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE COLLATE NOCASE`
- `description TEXT`
- `privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private'))`
- `creator_id TEXT NOT NULL REFERENCES users(id)`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

Create `community_memberships`:

- `id TEXT PRIMARY KEY`
- `community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE`
- `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member'))`
- `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'member', 'denied', 'removed'))`
- `requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `decided_at TEXT`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `UNIQUE (community_id, user_id)`

Indexes:

- `idx_communities_slug` on `communities(slug)`
- `idx_community_memberships_user_status` on `community_memberships(user_id, status)`
- `idx_community_memberships_community_status` on `community_memberships(community_id, status)`

### Migration 004: User-Aware Trattos

Add to `trattos`:

- `creator_id TEXT REFERENCES users(id)` initially nullable for backfill safety, then treated as required by application code.
- `community_id TEXT REFERENCES communities(id) ON DELETE SET NULL`
- `rules_json TEXT NOT NULL DEFAULT '[]'`

Add to `tratto_participants`:

- `user_id TEXT REFERENCES users(id) ON DELETE SET NULL`
- `invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL`
- `invited_at TEXT`

Add to `evidences`:

- `author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL`

Add to `comments`:

- `author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL`

Indexes:

- `idx_trattos_creator_id` on `trattos(creator_id)`
- `idx_trattos_community_id` on `trattos(community_id)`
- `idx_tratto_participants_user_id` on `tratto_participants(user_id)`
- `idx_evidences_author_user_id` on `evidences(author_user_id)`

Application rules:

- New Trattos must have `creator_id` equal to the authenticated user.
- Creator must also be inserted into `tratto_participants` with role `creator`, `invite_status = 'accepted'`, and `user_id` set.
- Invited users should be resolved by slug or id. If unresolved free-text invites are kept temporarily, store only `display_name` and leave `user_id` null.
- `rules_json` becomes canonical for new writes. Keep old `rules` as a migration bridge until frontend no longer needs string rules.

### Migration 005: Notifications

Create `notifications`:

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `type TEXT NOT NULL CHECK (type IN ('invite', 'mention', 'evidence', 'verdict', 'community_request', 'system'))`
- `title TEXT NOT NULL`
- `body TEXT`
- `target_url TEXT`
- `read_at TEXT`
- `archived_at TEXT`
- `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

Indexes:

- `idx_notifications_user_created_at` on `notifications(user_id, created_at)`
- `idx_notifications_user_read_at` on `notifications(user_id, read_at)`

### Migration 006: Verdict And Compliance Refinement

Keep existing `votes` and `tratto_verdicts`, but align route behavior:

- `review` means judgment requested or started.
- `compliance` means verdict exists and consequence fulfillment is pending.
- `finished` means consequence is fulfilled or case is archived.
- Map old `loser-detected` to `compliance` in API responses unless a legacy display badge is explicitly needed.

Optional later columns:

- `tratto_verdicts.status TEXT CHECK (status IN ('pending_compliance', 'fulfilled'))`
- `tratto_verdicts.fulfilled_at TEXT`

## Seed Data Plan

- Add deterministic users for every current participant: `marcosf`, `julias`, `carlosr`, `anapaula`, `pedrom`, `rafab`, `betoalves`, `lucasd`, `larac`, `claram`, `diegof`.
- Use a shared development password documented only as a local seed convenience, for example `Senha123!`.
- Backfill `trattos.creator_id` by matching the participant with role `creator`.
- Backfill `tratto_participants.user_id` by matching seed display names to seeded users.
- Backfill `evidences.author_user_id` and `comments.author_user_id` where the author exists.
- Add at least two communities: one public and one private.
- Add memberships where current seeded users are creators/admins/members.
- Add notifications that map to the UX guide: invite, evidence, verdict, community request, and system.

## Permissions

- Anonymous users can only call auth routes and health.
- Authenticated users can read their own dashboard, Trattos where they are creator/participant/judge, community-linked Trattos where they are an approved community member, public community summaries, their own notifications, and searchable users/communities.
- Tratto creator can edit a Tratto only while status is `pending`.
- Creator can request judgment when the Tratto is `active` and the current user is part of the Tratto.
- Assigned judges can request or resolve judgment for Trattos where they are assigned.
- Participants can add evidence/comments only when invite status is `accepted` and Tratto status is `active` or `review`.
- Community creators/admins can edit community details and approve/deny pending join requests.
- Community members can create Trattos linked to that community.
- Public communities can be joined directly as `member`.
- Private communities create a `pending` membership and notify admins/creator.
- Users can update only their own profile, theme, and notification read state.

## Migration Risks

- Display names are not unique globally. Backfill must not rely only on display name outside deterministic seed data.
- Existing `tratto_participants` has `UNIQUE (tratto_id, display_name)`, so two users with same display name cannot participate in one Tratto until uniqueness shifts to `(tratto_id, user_id)` for real users.
- Current `rules` is a text blob while product requirements want structured rule items. New writes should use `rules_json`; old rows need a best-effort split by line prefix.
- Frontend mocks use `currentUser.username = '@marcosf'`; backend should expose `slug: 'marcosf'` and frontend can format mentions as `@${slug}`.
- Current evidence/comment authors can be people who are not participants. The backend must decide whether comments remain open to community members later or require participation now.
- `loser-detected` exists in mock and schema but product marks it legacy. API response mapping must be consistent before frontend replaces badges.
- Current IDs are human-readable seed IDs. New code can keep text UUIDs, but route contracts must not assume sequential ids.
- SQLite cannot easily add some constraints after table creation. Tightening nullable backfilled columns may require table rebuild migrations; defer hard NOT NULL constraints until data is safely migrated.
- Bearer tokens in localStorage are simpler but vulnerable to XSS. For this project, keep tokens short-lived and document the tradeoff; do not mix cookie and bearer approaches.

## Implementation Sequence

1. Establish test harness and migration test database support.
2. Add users, auth tokens, password hashing, seed users, and auth routes.
3. Add auth middleware and current-user profile routes.
4. Add communities and memberships with permission checks.
5. Add user-aware Tratto reads and creation while preserving frontend-friendly DTOs.
6. Add evidence, comments, mentions, notifications, and notification routes.
7. Add judgment, votes, verdict, and compliance transitions.
8. Replace frontend mock flows incrementally through the Axios client on the future integration branch.

## PR Breakdown For `feat/backend`

### PR 1: `backend/test-harness`

Target branch: `feat/backend`

Scope:

- Add Node test runner setup and `supertest`.
- Add `npm test` command that runs `node --test`.
- Add a test database helper using a temporary SQLite file and `DATABASE_PATH` override.
- Add smoke tests for `GET /api/health`, not-found middleware, and migration execution.

Validation:

- `npm run lint`
- `npm test`
- `npm run db:reset`

### PR 2: `backend/users-auth-schema`

Target branch: `feat/backend`

Scope:

- Add migration 002 for `users` and `auth_tokens`.
- Add seed users with stable ids/slugs and hashed development passwords.
- Add small repository/service helpers for users and tokens.
- Add tests for unique email, unique slug, token hash persistence, and expired token cleanup behavior.

Validation:

- `npm run lint`
- `npm test`
- `npm run db:reset`

### PR 3: `backend/auth-routes`

Target branch: `feat/backend`

Scope:

- Add `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.
- Add bearer auth middleware.
- Add consistent error response helpers for validation, auth, forbidden, not found, and conflict.
- Add route tests for success, wrong password, duplicate email/slug, missing token, expired token, and logout invalidation.

Validation:

- `npm run lint`
- `npm test`

### PR 4: `backend/me-profile-settings`

Target branch: `feat/backend`

Scope:

- Add `PATCH /api/me` for `displayName`, `slug`, and `avatarUrl`.
- Add `PATCH /api/me/theme` for `grime` and `cassete`.
- Add slug normalization and uniqueness checks.
- Add tests proving one user's theme/profile changes do not affect another user.

Validation:

- `npm run lint`
- `npm test`

### PR 5: `backend/communities-schema-routes`

Target branch: `feat/backend`

Scope:

- Add migration 003 for `communities` and `community_memberships`.
- Add community seed data.
- Add `GET /api/communities`, `POST /api/communities`, `GET /api/communities/:slug`, and `PATCH /api/communities/:slug`.
- Add membership-aware response fields: `memberCount`, `activeTrattoCount`, `currentUserMembership`.
- Add tests for public/private visibility and admin-only update.

Validation:

- `npm run lint`
- `npm test`
- `npm run db:reset`

### PR 6: `backend/community-membership-actions`

Target branch: `feat/backend`

Scope:

- Add `POST /api/communities/:slug/join`.
- Add `POST /api/communities/:slug/requests/:membershipId/approve`.
- Add `POST /api/communities/:slug/requests/:membershipId/deny`.
- Add community request notifications for admins/creator.
- Add tests for public direct join, private pending request, duplicate join, non-admin approval denial, and approve/deny state changes.

Validation:

- `npm run lint`
- `npm test`

### PR 7: `backend/trattos-user-aware-schema`

Target branch: `feat/backend`

Scope:

- Add migration 004 for `creator_id`, `community_id`, `rules_json`, participant `user_id`, and author user ids.
- Backfill seeded rows.
- Add mapper functions that expose API DTOs with structured `participants`, structured `rules`, `evidence`, `comments`, and frontend convenience fields.
- Add tests for backfill and DTO mapping from legacy rows.

Validation:

- `npm run lint`
- `npm test`
- `npm run db:reset`

### PR 8: `backend/trattos-read-create-routes`

Target branch: `feat/backend`

Scope:

- Add `GET /api/trattos`, `GET /api/trattos/:id`, and `POST /api/trattos`.
- Add dashboard filters via query params: `status`, `communitySlug`, `scope=mine`.
- Add create payload with `participantSlugs`, optional `judgeSlug`, optional `communitySlug`, and `rules: string[]`.
- Create invite notifications for invited users.
- Add tests for standalone creation, community creation by member, private community non-member rejection, unknown participant slug, judge requirement, and detail permissions.

Validation:

- `npm run lint`
- `npm test`

### PR 9: `backend/evidence-comments-notifications`

Target branch: `feat/backend`

Scope:

- Add migration 005 for `notifications`.
- Add `POST /api/trattos/:id/evidences`.
- Add `POST /api/trattos/:id/comments` if comments remain in the UI contract.
- Add `GET /api/notifications`, `PATCH /api/notifications/:id/read`, and `PATCH /api/notifications/read-all`.
- Detect `@slug` mentions in evidence/comment content and notify mentioned users who can access the Tratto.
- Add tests for participant-only evidence, unsupported type, mention notification, unread counts, and read-all ownership.

Validation:

- `npm run lint`
- `npm test`

### PR 10: `backend/judgment-verdicts`

Target branch: `feat/backend`

Scope:

- Add `POST /api/trattos/:id/request-judgment`.
- Add `POST /api/trattos/:id/votes`.
- Add `POST /api/trattos/:id/verdict` for judge or mutual/manual resolution if needed.
- Add `POST /api/trattos/:id/complete` to move `compliance` to `finished`.
- Add verdict notifications.
- Add tests for creator/judge permissions, invalid status transitions, duplicate votes, verdict creation, and `loser-detected` mapping.

Validation:

- `npm run lint`
- `npm test`

### PR 11: `backend/frontend-contract-fixtures`

Target branch: `feat/backend`

Scope:

- Add example JSON fixtures for dashboard, Tratto detail, communities, notifications, and settings.
- Add contract tests that snapshot response keys without making tests brittle about timestamps.
- Update `docs/api-contract.md` if route responses changed during implementation.

Validation:

- `npm run lint`
- `npm test`

## Frontend Integration Points

- Login page stores bearer token after `POST /api/auth/login` and calls `GET /api/auth/me` on app boot.
- Axios client adds `Authorization: Bearer <token>` for authenticated routes.
- Dashboard replaces `mockTrattos`, `pendingInvites`, and stat calculations with `GET /api/dashboard` or `GET /api/trattos` plus `GET /api/notifications?unread=true`.
- Create Tratto form should send `rules` as an array, not the current text blob. UI can split lines temporarily until the frontend form is updated to row-based rules.
- Tratto detail reads `GET /api/trattos/:id`, posts evidence to `POST /api/trattos/:id/evidences`, and calls judgment routes based on `permissions` returned in the detail DTO.
- Communities pages use slug routes and should never rely on community id in URLs.
- Settings page uses `/api/me` and `/api/me/theme`; theme is persisted per user.

## Minimal Testing Setup

- Install dev dependency: `supertest`.
- Use built-in `node:test` and `node:assert/strict` to avoid a larger framework.
- Add `backend/test/helpers/testDatabase.js` to create a temporary `DATABASE_PATH`, run migrations, optionally seed data, and clean up after each test file.
- Export the Express `app` without listening, which is already true in `src/app.js`.
- Keep route tests as integration tests against the real app and a temporary SQLite database.
- Keep service tests small for password hashing, slug normalization, permission checks, and status transitions.

Commands after setup:

- `cd backend && npm run lint`
- `cd backend && npm test`
- `cd backend && npm run db:reset`
- `git diff --check`
