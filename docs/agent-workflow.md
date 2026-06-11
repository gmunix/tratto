# Agent Workflow

## Shared Rules

- Read `docs/product-spec.md`, `docs/frontend-ux-guide.md`, and `docs/backend-plan.md` before coding.
- Keep PRs small and easy to review.
- Use Portuguese UI copy and English code/commit messages.
- Preserve existing theme names: `grime` and `cassete`.
- Do not add financial betting language.
- Add tests when changing backend behavior or frontend logic that can be tested simply.
- Run relevant validation before opening a PR.

## UI Agent Mission

Branch: `agent/ui-ux-polish`

Base: `main`

Worktree: `../tratto-ui-agent`

Goal:

- Polish current and new pages using mock data that maps to the future backend.
- Add routes for `/notificacoes`, `/comunidades`, `/comunidades/:communitySlug`, and `/ajustes`.
- Remove `/perfil` route/page from navigation.
- Update dashboard, create form, and Tratto detail according to the UX guide.
- Add simple 8-bit/gamified visual touches without heavy dependencies.

Expected validation:

- `npm run lint` in `frontend/`
- `npm run build` in `frontend/`
- Mobile visual pass for dashboard, novo, tratto detail, notifications, communities, settings.

PR target:

- `main`

## Backend Planning Agent Mission

Branch: `agent/backend-planning`

Base: `main`

Worktree: `../tratto-backend-agent`

Goal:

- Review current backend and docs.
- Produce a concrete implementation plan for `feat/backend` broken into small PRs.
- Identify migration risks from existing display-name-only schema to real users.
- Suggest test setup and API contract fixtures.

Output:

- Update or add planning docs only unless explicitly asked to code.
- Do not open backend implementation PRs yet.

## Review Rules

- The lead reviews each PR for scope, domain correctness, permission rules, and validation.
- Ask for changes only when behavior is wrong, too large, untested, or conflicts with docs.
- Merge UI PR to `main` only after validation.
- Backend implementation PRs should be stacked or merged into `feat/backend` only.
