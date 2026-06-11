# Frontend UX Guide

## Routes

Public routes:

- `/`: landing page with product pitch and CTA to login.
- `/login`: mock/real login entry.

Authenticated app routes:

- `/dashboard`: recurring home for the current user.
- `/novo`: create a Tratto.
- `/trattos/:trattoId`: Tratto detail.
- `/notificacoes`: all notifications.
- `/comunidades`: discover and list communities.
- `/comunidades/:communitySlug`: community detail.
- `/ajustes`: profile, notifications, and theme settings.

Remove `/perfil`. Profile configuration moves to `/ajustes`.

## Navigation

Bottom nav should include:

- Painel: `/dashboard`
- Novo: `/novo`
- Comunidades: `/comunidades`
- Notificações: `/notificacoes`, with unread indicator
- Ajustes: `/ajustes`

Internal pages should not have a top app header. Use page-level section headers inside content.

## Dashboard

Goal: show what needs attention now.

Content:

- Stat cards: `Vitórias`, `Derrotas`, `Ativos`, `Pendências`.
- Each stat gets a theme-aware color token.
- Active Trattos panel.
- `Em julgamento` panel.
- `Histórico` panel.
- Notifications preview panel with recent notifications and CTA `Ver todas` to `/notificacoes`.

Remove:

- `Convites pendentes` card.
- `Checklist burocrático`.

## Novo

Goal: make a Tratto easy to define correctly.

Content behavior:

- Center the form panel.
- Category selection shows a short category description.
- Rules should be entered as multiple list items.
- Allow adding/removing rule rows.
- Participants can be invited manually by slug/name.
- Community relation is optional; users can create standalone Trattos.

Do not overbuild validation yet. Use clear mock interactions that map cleanly to future API calls.

## Tratto Detail

Goal: show a case file with clear status, rules, evidence, and next action.

Content behavior:

- Case summary with title, category, participants, status, progress/deadline.
- Rules rendered as a list.
- Consequence text must not overlap its label.
- Evidence feed supports text/link now and visually anticipates image evidence.
- Evidence input should have text and image/photo affordance, even if image upload is mocked.
- `Solicitar julgamento` only appears when current user is creator or assigned judge.

## Notificações

Goal: central place for all user attention items.

Content:

- List notifications sorted newest first.
- Types: invite, mention, evidence, verdict, community request, system.
- Unread indicator.
- Simple actions for relevant notifications: accept/deny invite, open Tratto, open community request.

## Comunidades

Goal: discover and access groups.

Content:

- Search by community name or slug.
- Section for user's communities.
- Section for search results/discovery.
- Community cards show name, slug, privacy, member count, active Trattos.

## Comunidade

Goal: show a group space around shared Trattos.

Content:

- Community summary: name, slug, privacy, description, creator.
- Participants list.
- Community Trattos list.
- CTA to create a Tratto in this community.
- Public community: join action.
- Private community: request access action.
- Creator/admin sees edit/manage participant affordances.

## Ajustes

Goal: user-controlled configuration.

Content:

- Profile settings: display name, slug, avatar placeholder.
- Notification settings: email/app toggles, unread behavior.
- Theme settings: `grime` and `cassete`; applies only to current user.
- Optional useful settings: account session info and danger-zone placeholder.

## Mock Data Guidelines

Mock data should model future backend shapes:

- Users with `id`, `name`, `slug`, `avatarUrl`, `theme`.
- Communities with `id`, `name`, `slug`, `privacy`, `creatorId`, `memberCount`.
- Trattos with `creatorId`, optional `communityId`, participants with roles, and rules as array.
- Notifications with `id`, `type`, `title`, `body`, `readAt`, `targetUrl`, `createdAt`.
