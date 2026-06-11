import { randomUUID } from 'node:crypto'

import { db as defaultDb } from '../database/connection.js'
import { toCommunityMembershipDto } from '../utils/communityDto.js'

const approvedMembershipPredicate = `membership.status = 'member'
  AND membership.role IN ('creator', 'admin', 'member')`

export function listVisibleCommunitiesForUser(userId, query, { db = defaultDb } = {}) {
  const normalizedQuery = normalizeQuery(query)
  const params = { userId }
  let queryFilter = ''

  if (normalizedQuery) {
    params.query = `%${normalizedQuery}%`
    queryFilter = `AND (LOWER(c.name) LIKE @query OR LOWER(c.slug) LIKE @query)`
  }

  return db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.privacy,
        c.creator_id,
        creator.display_name AS creator_display_name,
        creator.slug AS creator_slug,
        creator.avatar_url AS creator_avatar_url,
        c.created_at,
        c.updated_at,
        membership.id AS membership_id,
        membership.user_id AS membership_user_id,
        membership.role AS membership_role,
        membership.status AS membership_status,
        membership.requested_at AS membership_requested_at,
        membership.decided_at AS membership_decided_at,
        membership.created_at AS membership_created_at,
        membership.updated_at AS membership_updated_at,
        COALESCE(member_counts.member_count, 0) AS member_count
      FROM communities c
      INNER JOIN users creator ON creator.id = c.creator_id
      LEFT JOIN community_memberships membership
        ON membership.community_id = c.id
        AND membership.user_id = @userId
      LEFT JOIN (
        SELECT community_id, COUNT(*) AS member_count
        FROM community_memberships
        WHERE status = 'member'
        GROUP BY community_id
      ) member_counts ON member_counts.community_id = c.id
      WHERE (c.privacy = 'public' OR (${approvedMembershipPredicate}))
      ${queryFilter}
      ORDER BY c.created_at DESC, c.name ASC`,
    )
    .all(params)
    .map(mapCommunityWithMembership)
}

export function listUserCommunities(userId, { db = defaultDb } = {}) {
  return db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.privacy,
        c.creator_id,
        creator.display_name AS creator_display_name,
        creator.slug AS creator_slug,
        creator.avatar_url AS creator_avatar_url,
        c.created_at,
        c.updated_at,
        membership.id AS membership_id,
        membership.user_id AS membership_user_id,
        membership.role AS membership_role,
        membership.status AS membership_status,
        membership.requested_at AS membership_requested_at,
        membership.decided_at AS membership_decided_at,
        membership.created_at AS membership_created_at,
        membership.updated_at AS membership_updated_at,
        COALESCE(member_counts.member_count, 0) AS member_count
      FROM communities c
      INNER JOIN users creator ON creator.id = c.creator_id
      INNER JOIN community_memberships membership
        ON membership.community_id = c.id
        AND membership.user_id = ?
      LEFT JOIN (
        SELECT community_id, COUNT(*) AS member_count
        FROM community_memberships
        WHERE status = 'member'
        GROUP BY community_id
      ) member_counts ON member_counts.community_id = c.id
      WHERE ${approvedMembershipPredicate}
      ORDER BY c.created_at DESC, c.name ASC`,
    )
    .all(userId)
    .map(mapCommunityWithMembership)
}

export function findCommunityBySlugForUser(slug, userId, { db = defaultDb } = {}) {
  return mapCommunityWithMembership(
    db
      .prepare(
        `SELECT
          c.id,
          c.name,
          c.slug,
          c.description,
          c.privacy,
          c.creator_id,
          creator.display_name AS creator_display_name,
          creator.slug AS creator_slug,
          creator.avatar_url AS creator_avatar_url,
          c.created_at,
          c.updated_at,
          membership.id AS membership_id,
          membership.user_id AS membership_user_id,
          membership.role AS membership_role,
          membership.status AS membership_status,
          membership.requested_at AS membership_requested_at,
          membership.decided_at AS membership_decided_at,
          membership.created_at AS membership_created_at,
          membership.updated_at AS membership_updated_at,
          COALESCE(member_counts.member_count, 0) AS member_count
        FROM communities c
        INNER JOIN users creator ON creator.id = c.creator_id
        LEFT JOIN community_memberships membership
          ON membership.community_id = c.id
          AND membership.user_id = ?
        LEFT JOIN (
          SELECT community_id, COUNT(*) AS member_count
          FROM community_memberships
          WHERE status = 'member'
          GROUP BY community_id
        ) member_counts ON member_counts.community_id = c.id
        WHERE c.slug = ?`,
      )
      .get(userId, slug.trim().toLowerCase()),
  )
}

export function listMembersForCommunity(communityId, { db = defaultDb } = {}) {
  return db
    .prepare(
      `SELECT
        membership.id,
        membership.community_id,
        membership.user_id,
        membership.role,
        membership.status,
        membership.requested_at,
        membership.decided_at,
        membership.created_at,
        membership.updated_at,
        users.display_name,
        users.slug,
        users.avatar_url
      FROM community_memberships membership
      INNER JOIN users ON users.id = membership.user_id
      WHERE membership.community_id = ?
        AND membership.status = 'member'
      ORDER BY
        CASE membership.role
          WHEN 'creator' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END,
        users.display_name ASC`,
    )
    .all(communityId)
    .map(mapMembershipWithUser)
}

export function createCommunityWithCreatorMembership(
  community,
  creatorId,
  { db = defaultDb, id = randomUUID(), membershipId = randomUUID(), now = new Date().toISOString() } = {},
) {
  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO communities (
        id,
        name,
        slug,
        description,
        privacy,
        creator_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      community.name.trim(),
      community.slug.trim().toLowerCase(),
      community.description || null,
      community.privacy,
      creatorId,
      now,
      now,
    )

    db.prepare(
      `INSERT INTO community_memberships (
        id,
        community_id,
        user_id,
        role,
        status,
        requested_at,
        decided_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 'creator', 'member', ?, ?, ?, ?)`,
    ).run(membershipId, id, creatorId, now, now, now, now)
  })

  create()

  return findCommunityBySlugForUser(community.slug, creatorId, { db })
}

function mapCommunityWithMembership(row) {
  if (!row) {
    return null
  }

  const membership = row.membership_id
    ? {
        id: row.membership_id,
        communityId: row.id,
        userId: row.membership_user_id,
        role: row.membership_role,
        status: row.membership_status,
        requestedAt: row.membership_requested_at,
        decidedAt: row.membership_decided_at,
        createdAt: row.membership_created_at,
        updatedAt: row.membership_updated_at,
      }
    : null

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    privacy: row.privacy,
    creatorId: row.creator_id,
    creator: {
      id: row.creator_id,
      displayName: row.creator_display_name,
      slug: row.creator_slug,
      avatarUrl: row.creator_avatar_url,
    },
    memberCount: row.member_count,
    activeTrattoCount: 0,
    currentUserMembership: toCommunityMembershipDto(membership),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMembershipWithUser(row) {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      displayName: row.display_name,
      slug: row.slug,
      avatarUrl: row.avatar_url,
    },
  }
}

function normalizeQuery(query) {
  return typeof query === 'string' ? query.trim().toLowerCase() : ''
}
