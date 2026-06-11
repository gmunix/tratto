# Tratto Product Spec

## Positioning

Tratto is a social agreement app for friends, communities, and informal challenges. It records what was agreed, who is involved, the rules, the deadline, evidence, and the final decision.

Tratto is not a betting, finance, wallet, or gambling product. Avoid money-first language. Prefer social consequence, agreement, challenge, proof, verdict, and reputation language.

## Product Promise

Users should feel like they are using a serious, over-engineered case management system for unserious social agreements.

Core tone in Portuguese:

- Direct, playful, mock-bureaucratic.
- Serious UI language for silly situations.
- No financial betting framing.

## Main User Capabilities

- Create a Tratto unrelated to any community by manually inviting users.
- Create a Tratto inside a community so members can participate or follow it.
- Add rules as structured list items, not a single text blob.
- Add evidence as text, links, and later photos/files.
- Mention users with unique slugs in evidence text.
- Ask for or start judgment depending on permissions.
- Receive notifications for invites, mentions, evidence, community requests, and verdicts.
- Change personal settings, including theme, without changing other users' themes.

## Auth Direction

Authentication is required for the real backend phase. Keep it simple:

- Email/password login is enough for the first real version.
- Store password hashes, never raw passwords.
- Use session or bearer token consistently; prefer a small bearer-token implementation if it keeps the app simpler.
- Current mock user is only a visual placeholder.

## Slugs

Users and communities must have unique customizable slugs.

- User slug example: `marcosf` and display mention `@marcosf`.
- Community slug example: `republica-404`.
- Slugs are used for search, mentions, invitations, and stable URLs.

## Permissions

- Tratto creator can edit the Tratto before it is active and can request judgment.
- Judges can request or resolve judgment for Trattos where they are assigned.
- Participants can add evidence and comments to their own Trattos.
- Community creator/admin can edit community details and manage participants.
- Community members can create Trattos linked to that community.
- Public communities can be joined directly.
- Private communities require a join request approved or denied by the creator/admin.

## Statuses

Tratto statuses:

- `pending`: waiting for invited participants to accept.
- `active`: accepted and in progress.
- `review`: under judgment.
- `compliance`: verdict exists, waiting for consequence fulfillment.
- `finished`: completed and archived.
- `loser-detected`: legacy/mock status; backend can map to `compliance` or keep as display status if needed.
- `cancelled`: cancelled before resolution.

Community membership statuses:

- `member`
- `admin`
- `creator`
- `pending`
- `denied`
- `removed`

Notification statuses:

- `unread`
- `read`
- `archived`

## Visual Direction

- Mobile-first and bottom-nav focused after login.
- Top bar only for landing and login.
- Internal pages should use content headers inside the page, not sticky top bars.
- Gamified 8-bit feeling through subtle particles, pixel borders, badges, progress, small animations, and status colors.
- Keep animations simple, CSS-first, and avoid heavy libraries.
- Supported themes: `grime` and `cassete`.
