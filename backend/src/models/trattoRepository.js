import { randomUUID } from 'node:crypto'

import { db as defaultDb } from '../database/connection.js'
import { rulesToJson, rulesToText } from '../utils/trattoDto.js'

const approvedCommunityMembership = `community_memberships.status = 'member'
  AND community_memberships.role IN ('creator', 'admin', 'member')`

export function listVisibleTrattosForUser(userId, filters = {}, { db = defaultDb } = {}) {
  const params = { userId }
  const where = [visiblePredicate()]

  if (filters.status) {
    params.status = filters.status
    where.push('trattos.status = @status')
  }

  if (filters.communitySlug) {
    params.communitySlug = filters.communitySlug
    where.push('communities.slug = @communitySlug')
  }

  if (filters.scope === 'mine') {
    where.push(`(trattos.creator_id = @userId OR EXISTS (
      SELECT 1
      FROM tratto_participants mine
      WHERE mine.tratto_id = trattos.id
        AND mine.user_id = @userId
    ))`)
  }

  const rows = db
    .prepare(
      `${trattoSelectSql()}
      WHERE ${where.join(' AND ')}
      ORDER BY trattos.created_at DESC, trattos.id DESC`,
    )
    .all(params)

  return hydrateTrattos(rows, { db })
}

export function findVisibleTrattoById(id, userId, { db = defaultDb } = {}) {
  const rows = db
    .prepare(
      `${trattoSelectSql()}
      WHERE trattos.id = @id
        AND ${visiblePredicate()}`,
    )
    .all({ id, userId })

  return hydrateTrattos(rows, { db, includeDetail: true })[0] ?? null
}

export function findTrattoById(id, { db = defaultDb } = {}) {
  const rows = db
    .prepare(
      `${trattoSelectSql()}
      WHERE trattos.id = @id`,
    )
    .all({ id })

  return hydrateTrattos(rows, { db, includeDetail: true })[0] ?? null
}

export function createTratto(input, creator, { db = defaultDb, now = new Date().toISOString() } = {}) {
  const id = randomUUID()
  const caseNumber = nextCaseNumber(db)
  const rulesJson = rulesToJson(input.rules)
  const rules = rulesToText(input.rules)

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO trattos (
        id,
        case_number,
        title,
        description,
        category,
        consequence,
        rules,
        rules_json,
        status,
        deadline,
        decision_method,
        creator_id,
        community_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      caseNumber,
      input.title,
      input.description || null,
      input.category,
      input.consequence || null,
      rules,
      rulesJson,
      input.deadline || null,
      input.decisionMethod,
      creator.id,
      input.community?.id ?? null,
      now,
      now,
    )

    insertParticipant(db, {
      id: randomUUID(),
      trattoId: id,
      user: creator,
      role: 'creator',
      inviteStatus: 'accepted',
      acceptedAt: now,
      invitedByUserId: null,
      invitedAt: now,
      createdAt: now,
    })

    for (const participant of input.participants) {
      insertParticipant(db, {
        id: randomUUID(),
        trattoId: id,
        user: participant,
        role: 'participant',
        inviteStatus: 'pending',
        acceptedAt: null,
        invitedByUserId: creator.id,
        invitedAt: now,
        createdAt: now,
      })
    }

    if (input.judge) {
      insertParticipant(db, {
        id: randomUUID(),
        trattoId: id,
        user: input.judge,
        role: 'judge',
        inviteStatus: 'pending',
        acceptedAt: null,
        invitedByUserId: creator.id,
        invitedAt: now,
        createdAt: now,
      })
    }
  })

  create()

  return findVisibleTrattoById(id, creator.id, { db })
}

export function createEvidenceForTratto(
  trattoId,
  input,
  currentUser,
  currentParticipant,
  { db = defaultDb, now = new Date().toISOString() } = {},
) {
  const id = randomUUID()

  db.prepare(
    `INSERT INTO evidences (
      id,
      tratto_id,
      author_participant_id,
      author_display_name,
      type,
      content,
      metadata_json,
      author_user_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    trattoId,
    currentParticipant.id,
    currentUser.displayName,
    input.type,
    input.content,
    input.metadata ? JSON.stringify(input.metadata) : null,
    currentUser.id,
    now,
  )

  const tratto = findVisibleTrattoById(trattoId, currentUser.id, { db })

  return {
    evidence: tratto.evidence.find((item) => item.id === id),
    tratto,
  }
}

export function userHasApprovedCommunityMembership(communityId, userId, { db = defaultDb } = {}) {
  return Boolean(
    db
      .prepare(
        `SELECT 1
        FROM community_memberships
        WHERE community_id = ?
          AND user_id = ?
          AND status = 'member'
          AND role IN ('creator', 'admin', 'member')`,
      )
      .get(communityId, userId),
  )
}

function insertParticipant(db, participant) {
  db.prepare(
    `INSERT INTO tratto_participants (
      id,
      tratto_id,
      display_name,
      role,
      invite_status,
      accepted_at,
      created_at,
      user_id,
      invited_by_user_id,
      invited_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    participant.id,
    participant.trattoId,
    participant.user.displayName,
    participant.role,
    participant.inviteStatus,
    participant.acceptedAt,
    participant.createdAt,
    participant.user.id,
    participant.invitedByUserId,
    participant.invitedAt,
  )
}

function trattoSelectSql() {
  return `SELECT
    trattos.id,
    trattos.case_number,
    trattos.title,
    trattos.description,
    trattos.category,
    trattos.consequence,
    trattos.rules,
    trattos.rules_json,
    trattos.status,
    trattos.deadline,
    trattos.decision_method,
    trattos.creator_id,
    trattos.community_id,
    trattos.created_at,
    trattos.updated_at,
    creator.display_name AS creator_display_name,
    creator.slug AS creator_slug,
    creator.avatar_url AS creator_avatar_url,
    communities.name AS community_name,
    communities.slug AS community_slug,
    communities.privacy AS community_privacy
  FROM trattos
  LEFT JOIN users creator ON creator.id = trattos.creator_id
  LEFT JOIN communities ON communities.id = trattos.community_id`
}

function visiblePredicate() {
  return `(trattos.creator_id = @userId
    OR EXISTS (
      SELECT 1
      FROM tratto_participants visible_participant
      WHERE visible_participant.tratto_id = trattos.id
        AND visible_participant.user_id = @userId
    )
    OR EXISTS (
      SELECT 1
      FROM community_memberships
      WHERE community_memberships.community_id = trattos.community_id
        AND community_memberships.user_id = @userId
        AND ${approvedCommunityMembership}
    ))`
}

function hydrateTrattos(rows, { db, includeDetail = false }) {
  if (rows.length === 0) {
    return []
  }

  const ids = rows.map((row) => row.id)
  const participantsByTratto = groupByTrattoId(fetchParticipants(ids, { db }))
  const evidenceByTratto = includeDetail ? groupByTrattoId(fetchEvidence(ids, { db })) : new Map()
  const commentsByTratto = includeDetail ? groupByTrattoId(fetchComments(ids, { db })) : new Map()
  const verdictsByTratto = includeDetail ? fetchVerdicts(ids, { db }) : new Map()

  return rows.map((row) => ({
    id: row.id,
    caseNumber: row.case_number,
    title: row.title,
    description: row.description,
    category: row.category,
    consequence: row.consequence,
    rulesText: row.rules,
    rulesJson: row.rules_json,
    status: row.status,
    deadline: row.deadline,
    decisionMethod: row.decision_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    creator: row.creator_id
      ? {
          id: row.creator_id,
          displayName: row.creator_display_name,
          slug: row.creator_slug,
          avatarUrl: row.creator_avatar_url,
        }
      : null,
    community: row.community_id
      ? {
          id: row.community_id,
          name: row.community_name,
          slug: row.community_slug,
          privacy: row.community_privacy,
        }
      : null,
    participants: participantsByTratto.get(row.id) ?? [],
    evidence: evidenceByTratto.get(row.id) ?? [],
    comments: commentsByTratto.get(row.id) ?? [],
    verdict: verdictsByTratto.get(row.id) ?? null,
  }))
}

function fetchParticipants(ids, { db }) {
  return db
    .prepare(
      `SELECT
        participant.id,
        participant.tratto_id,
        participant.display_name,
        participant.role,
        participant.invite_status,
        participant.user_id,
        users.display_name AS user_display_name,
        users.slug AS user_slug,
        users.avatar_url AS user_avatar_url
      FROM tratto_participants participant
      LEFT JOIN users ON users.id = participant.user_id
      WHERE participant.tratto_id IN (${placeholders(ids)})
      ORDER BY
        CASE participant.role
          WHEN 'creator' THEN 1
          WHEN 'participant' THEN 2
          ELSE 3
        END,
        participant.created_at ASC`,
    )
    .all(...ids)
    .map((row) => ({
      trattoId: row.tratto_id,
      id: row.id,
      displayName: row.display_name,
      role: row.role,
      inviteStatus: row.invite_status,
      user: row.user_id
        ? {
            id: row.user_id,
            displayName: row.user_display_name,
            slug: row.user_slug,
            avatarUrl: row.user_avatar_url,
          }
        : null,
    }))
}

function fetchEvidence(ids, { db }) {
  return db
    .prepare(
      `SELECT
        evidence.id,
        evidence.tratto_id,
        evidence.author_display_name,
        evidence.author_user_id,
        evidence.type,
        evidence.content,
        evidence.metadata_json,
        evidence.created_at,
        users.display_name AS author_display_name_from_user,
        users.slug AS author_slug,
        users.avatar_url AS author_avatar_url
      FROM evidences evidence
      LEFT JOIN users ON users.id = evidence.author_user_id
      WHERE evidence.tratto_id IN (${placeholders(ids)})
      ORDER BY evidence.created_at ASC`,
    )
    .all(...ids)
    .map((row) => mapAuthoredRow(row))
}

function fetchComments(ids, { db }) {
  return db
    .prepare(
      `SELECT
        comment.id,
        comment.tratto_id,
        comment.author_display_name,
        comment.author_user_id,
        comment.content,
        comment.created_at,
        users.display_name AS author_display_name_from_user,
        users.slug AS author_slug,
        users.avatar_url AS author_avatar_url
      FROM comments comment
      LEFT JOIN users ON users.id = comment.author_user_id
      WHERE comment.tratto_id IN (${placeholders(ids)})
      ORDER BY comment.created_at ASC`,
    )
    .all(...ids)
    .map((row) => mapAuthoredRow(row))
}

function fetchVerdicts(ids, { db }) {
  return new Map(
    db
      .prepare(
        `SELECT id, tratto_id, decision_method, summary, created_at
        FROM tratto_verdicts
        WHERE tratto_id IN (${placeholders(ids)})`,
      )
      .all(...ids)
      .map((row) => [
        row.tratto_id,
        {
          id: row.id,
          decisionMethod: row.decision_method,
          summary: row.summary,
          createdAt: row.created_at,
        },
      ]),
  )
}

function mapAuthoredRow(row) {
  return {
    trattoId: row.tratto_id,
    id: row.id,
    authorName: row.author_display_name,
    author: row.author_user_id
      ? {
          id: row.author_user_id,
          displayName: row.author_display_name_from_user,
          slug: row.author_slug,
          avatarUrl: row.author_avatar_url,
        }
      : null,
    type: row.type,
    content: row.content,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
  }
}

function groupByTrattoId(rows) {
  const byTratto = new Map()

  for (const row of rows) {
    const rowsForTratto = byTratto.get(row.trattoId) ?? []
    rowsForTratto.push(row)
    byTratto.set(row.trattoId, rowsForTratto)
  }

  return byTratto
}

function nextCaseNumber(db) {
  const row = db.prepare('SELECT COUNT(*) + 1 AS next_number FROM trattos').get()
  return `TRT-${String(row.next_number).padStart(4, '0')}`
}

function placeholders(values) {
  return values.map(() => '?').join(', ')
}
