# API Contract

## Conventions

- Base URL: `/api`.
- Auth: `Authorization: Bearer <token>` for all routes except health and auth register/login.
- Content type: JSON.
- Dates: ISO 8601 strings from the backend. Date-only fields may stay as `YYYY-MM-DD` for deadlines.
- IDs: opaque strings. Frontend must not parse or generate persisted ids.
- Slugs: lowercase, unique, stable route/search identifiers. Display mentions should be formatted as `@${slug}` by the frontend.

## Error Shape

```json
{
  "message": "Email already in use",
  "code": "CONFLICT",
  "fields": {
    "email": "already_in_use"
  }
}
```

Common statuses:

- `400` validation error.
- `401` missing, invalid, or expired token.
- `403` authenticated but not allowed.
- `404` resource not found or not visible to current user.
- `409` unique conflict or invalid state transition.
- `500` unexpected backend error.

## DTOs

### User

```json
{
  "id": "usr-marcos",
  "email": "marcos@example.com",
  "displayName": "Marcos Ferreira",
  "slug": "marcosf",
  "avatarUrl": null,
  "theme": "grime",
  "createdAt": "2026-05-01T12:00:00.000Z"
}
```

### Public User

```json
{
  "id": "usr-marcos",
  "displayName": "Marcos Ferreira",
  "slug": "marcosf",
  "avatarUrl": null
}
```

### Community

```json
{
  "id": "com-republica-404",
  "name": "República 404",
  "slug": "republica-404",
  "privacy": "private",
  "description": "Acordos domésticos com rigor desnecessário.",
  "creator": {
    "id": "usr-marcos",
    "displayName": "Marcos Ferreira",
    "slug": "marcosf",
    "avatarUrl": null
  },
  "memberCount": 5,
  "activeTrattoCount": 2,
  "currentUserMembership": {
    "role": "member",
    "status": "member"
  },
  "createdAt": "2026-05-01T12:00:00.000Z"
}
```

### Tratto Summary

```json
{
  "id": "trt-0001",
  "caseNumber": "TRT-0001",
  "title": "Comer 12 pães de queijo em uma sentada",
  "description": "Marcos declarou capacidade plena em reunião familiar.",
  "category": "Desafio gastronômico",
  "status": "active",
  "consequence": "Quem perder compra café para a outra pessoa por uma semana.",
  "deadline": "2026-06-15",
  "createdAt": "2026-05-01T12:00:00.000Z",
  "decisionMethod": "vote",
  "progress": 42,
  "community": null,
  "participants": [
    {
      "id": "trt-0001-marcos",
      "role": "creator",
      "inviteStatus": "accepted",
      "displayName": "Marcos Ferreira",
      "user": {
        "id": "usr-marcos",
        "displayName": "Marcos Ferreira",
        "slug": "marcosf",
        "avatarUrl": null
      }
    }
  ],
  "participantNames": ["Marcos Ferreira", "Julia Souza"]
}
```

`participantNames` is a temporary frontend bridge for current cards that render `participants.join(' contra ')`.

### Tratto Detail

```json
{
  "id": "trt-0001",
  "caseNumber": "TRT-0001",
  "title": "Comer 12 pães de queijo em uma sentada",
  "description": "Marcos declarou capacidade plena em reunião familiar.",
  "category": "Desafio gastronômico",
  "status": "active",
  "consequence": "Quem perder compra café para a outra pessoa por uma semana.",
  "deadline": "2026-06-15",
  "createdAt": "2026-05-01T12:00:00.000Z",
  "updatedAt": "2026-05-12T09:45:00.000Z",
  "decisionMethod": "vote",
  "progress": 42,
  "community": null,
  "creator": {
    "id": "usr-marcos",
    "displayName": "Marcos Ferreira",
    "slug": "marcosf",
    "avatarUrl": null
  },
  "participants": [],
  "participantNames": ["Marcos Ferreira", "Julia Souza"],
  "rules": [
    {
      "id": "rule-1",
      "text": "Os pães de queijo precisam ser de tamanho normal.",
      "position": 1
    }
  ],
  "rulesText": "1. Os pães de queijo precisam ser de tamanho normal.",
  "evidence": [],
  "comments": [],
  "verdict": null,
  "permissions": {
    "canEdit": false,
    "canAddEvidence": true,
    "canRequestJudgment": true,
    "canVote": true,
    "canResolveVerdict": false,
    "canComplete": false
  }
}
```

`rulesText` is a temporary bridge for the current detail page that renders `rules.split('\n')`.

### Evidence

```json
{
  "id": "ev-001",
  "author": {
    "id": "usr-marcos",
    "displayName": "Marcos Ferreira",
    "slug": "marcosf",
    "avatarUrl": null
  },
  "authorName": "Marcos Ferreira",
  "type": "text",
  "content": "Treino concluído com 8 unidades.",
  "metadata": null,
  "createdAt": "2026-05-10T14:23:00.000Z"
}
```

`authorName` is a temporary frontend bridge for current evidence timeline rendering.

### Notification

```json
{
  "id": "ntf-001",
  "type": "invite",
  "title": "Convite para Tratto",
  "body": "Julia Souza convidou você para um acordo socialmente vinculante.",
  "targetUrl": "/trattos/trt-0001",
  "readAt": null,
  "createdAt": "2026-05-12T09:45:00.000Z"
}
```

## Routes

### Health

`GET /api/health`

Response `200`:

```json
{
  "status": "ok",
  "service": "tratto-api"
}
```

### Register

`POST /api/auth/register`

Request:

```json
{
  "email": "marcos@example.com",
  "password": "Senha123!",
  "displayName": "Marcos Ferreira",
  "slug": "marcosf"
}
```

Response `201`:

```json
{
  "token": "plain-token-returned-once",
  "user": {
    "id": "usr-marcos",
    "email": "marcos@example.com",
    "displayName": "Marcos Ferreira",
    "slug": "marcosf",
    "avatarUrl": null,
    "theme": "grime",
    "createdAt": "2026-05-01T12:00:00.000Z"
  }
}
```

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "marcos@example.com",
  "password": "Senha123!"
}
```

Response `200`: same as register response.

### Logout

`POST /api/auth/logout`

Response `204` with no body.

### Current User

`GET /api/auth/me`

Response `200`:

```json
{
  "user": {
    "id": "usr-marcos",
    "email": "marcos@example.com",
    "displayName": "Marcos Ferreira",
    "slug": "marcosf",
    "avatarUrl": null,
    "theme": "grime",
    "createdAt": "2026-05-01T12:00:00.000Z"
  }
}
```

### Update Profile

`PATCH /api/me`

Request:

```json
{
  "displayName": "Marcos F.",
  "slug": "marcosf",
  "avatarUrl": null
}
```

Response `200`:

```json
{
  "user": {}
}
```

### Update Theme

`PATCH /api/me/theme`

Request:

```json
{
  "theme": "cassete"
}
```

Response `200`:

```json
{
  "user": {}
}
```

### Search Users

`GET /api/users?query=mar`

Response `200`:

```json
{
  "users": []
}
```

Search matches display name and slug. Use for invites, judges, and mentions.

### List Trattos

`GET /api/trattos?scope=mine&status=active&communitySlug=republica-404`

Response `200`:

```json
{
  "trattos": [],
  "stats": {
    "wins": 0,
    "losses": 0,
    "active": 1,
    "pending": 0,
    "review": 0,
    "finished": 0
  }
}
```

### Create Tratto

`POST /api/trattos`

Request:

```json
{
  "title": "Comer 12 pães de queijo em uma sentada",
  "description": "Marcos declarou capacidade plena.",
  "category": "Desafio gastronômico",
  "consequence": "Quem perder compra café por uma semana.",
  "rules": [
    "Os pães de queijo precisam ser de tamanho normal.",
    "Não vale intervalo maior que dois minutos."
  ],
  "deadline": "2026-06-15",
  "decisionMethod": "vote",
  "participantSlugs": ["julias"],
  "judgeSlug": null,
  "communitySlug": null
}
```

Response `201`:

```json
{
  "tratto": {}
}
```

Rules:

- Creator is inferred from the bearer token.
- Creator should not be included in `participantSlugs`.
- `judgeSlug` is required when `decisionMethod` is `judge`.
- `communitySlug` is optional.
- If `communitySlug` is private, current user must be a `member`, `admin`, or `creator` with status `member`.

### Get Tratto Detail

`GET /api/trattos/:id`

Response `200`:

```json
{
  "tratto": {}
}
```

### Add Evidence

`POST /api/trattos/:id/evidences`

Request:

```json
{
  "type": "text",
  "content": "Treino concluído com 8 unidades.",
  "metadata": null
}
```

Response `201`:

```json
{
  "evidence": {}
}
```

Rules:

- `type` can be `text`, `link`, `image`, or `file` in storage.
- First implementation may accept only `text` and `link` while returning `400` for upload types until file upload exists.
- Mention parsing should detect `@slug` in `content`.

### Request Judgment

`POST /api/trattos/:id/request-judgment`

Request:

```json
{
  "reason": "Evidências suficientes para constrangimento público."
}
```

Response `200`:

```json
{
  "tratto": {}
}
```

Rules:

- Allowed for creator or assigned judge.
- Valid from `active` to `review`.
- Not valid for `pending`, `compliance`, `finished`, or `cancelled`.

### Vote

`POST /api/trattos/:id/votes`

Request:

```json
{
  "value": "winner",
  "votedForParticipantId": "trt-0001-julia",
  "reason": "Prova mais robusta."
}
```

Response `201`:

```json
{
  "vote": {
    "id": "vote-001"
  }
}
```

### Create Verdict

`POST /api/trattos/:id/verdict`

Request:

```json
{
  "winnerParticipantId": "trt-0001-julia",
  "loserParticipantId": "trt-0001-marcos",
  "summary": "Perdedor identificado após análise de evidências."
}
```

Response `201`:

```json
{
  "tratto": {}
}
```

Rules:

- Judge method requires assigned judge.
- Vote method can be resolved by backend after vote threshold or by creator/admin rule if kept manual.
- Status moves to `compliance` after verdict.

### Complete Tratto

`POST /api/trattos/:id/complete`

Request:

```json
{
  "note": "Consequência cumprida sem recurso."
}
```

Response `200`:

```json
{
  "tratto": {}
}
```

### List Communities

`GET /api/communities?query=republica`

Response `200`:

```json
{
  "myCommunities": [],
  "communities": []
}
```

### Create Community

`POST /api/communities`

Request:

```json
{
  "name": "República 404",
  "slug": "republica-404",
  "privacy": "private",
  "description": "Acordos domésticos com rigor desnecessário."
}
```

Response `201`:

```json
{
  "community": {}
}
```

### Get Community

`GET /api/communities/:slug`

Response `200`:

```json
{
  "community": {},
  "members": [],
  "trattos": [],
  "pendingRequests": []
}
```

`pendingRequests` should only be populated for creator/admin.

### Update Community

`PATCH /api/communities/:slug`

Request:

```json
{
  "name": "República 404",
  "description": "Texto atualizado.",
  "privacy": "public"
}
```

Response `200`:

```json
{
  "community": {}
}
```

### Join Community

`POST /api/communities/:slug/join`

Response `200` for public communities:

```json
{
  "membership": {
    "id": "mbr-001",
    "role": "member",
    "status": "member"
  }
}
```

Response `202` for private communities:

```json
{
  "membership": {
    "id": "mbr-001",
    "role": "member",
    "status": "pending"
  }
}
```

### Approve Community Request

`POST /api/communities/:slug/requests/:membershipId/approve`

Response `200`:

```json
{
  "membership": {
    "id": "mbr-001",
    "role": "member",
    "status": "member"
  }
}
```

### Deny Community Request

`POST /api/communities/:slug/requests/:membershipId/deny`

Response `200`:

```json
{
  "membership": {
    "id": "mbr-001",
    "role": "member",
    "status": "denied"
  }
}
```

### List Notifications

`GET /api/notifications?status=unread`

Response `200`:

```json
{
  "notifications": [],
  "unreadCount": 0
}
```

### Mark Notification Read

`PATCH /api/notifications/:id/read`

Response `200`:

```json
{
  "notification": {}
}
```

### Mark All Notifications Read

`PATCH /api/notifications/read-all`

Response `200`:

```json
{
  "updatedCount": 3
}
```
