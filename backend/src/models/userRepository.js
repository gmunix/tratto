import { randomUUID } from 'node:crypto'

import { db as defaultDb } from '../database/connection.js'

export function createUser(
  user,
  { db = defaultDb, id = randomUUID(), now = new Date().toISOString() } = {},
) {
  const row = {
    id,
    email: user.email.trim().toLowerCase(),
    passwordHash: user.passwordHash,
    displayName: user.displayName.trim(),
    slug: user.slug.trim().toLowerCase(),
    avatarUrl: user.avatarUrl ?? null,
    theme: user.theme ?? 'grime',
    createdAt: now,
    updatedAt: now,
  }

  db.prepare(
    `INSERT INTO users (
      id,
      email,
      password_hash,
      display_name,
      slug,
      avatar_url,
      theme,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.email,
    row.passwordHash,
    row.displayName,
    row.slug,
    row.avatarUrl,
    row.theme,
    row.createdAt,
    row.updatedAt,
  )

  return findUserById(row.id, { db })
}

export function findUserById(id, { db = defaultDb } = {}) {
  return mapUser(
    db
      .prepare(
        `SELECT
          id,
          email,
          password_hash,
          display_name,
          slug,
          avatar_url,
          theme,
          created_at,
          updated_at
        FROM users
        WHERE id = ?`,
      )
      .get(id),
  )
}

export function findUserByEmail(email, { db = defaultDb } = {}) {
  return mapUser(
    db
      .prepare(
        `SELECT
          id,
          email,
          password_hash,
          display_name,
          slug,
          avatar_url,
          theme,
          created_at,
          updated_at
        FROM users
        WHERE email = ?`,
      )
      .get(email.trim().toLowerCase()),
  )
}

export function findUserBySlug(slug, { db = defaultDb } = {}) {
  return mapUser(
    db
      .prepare(
        `SELECT
          id,
          email,
          password_hash,
          display_name,
          slug,
          avatar_url,
          theme,
          created_at,
          updated_at
        FROM users
        WHERE slug = ?`,
      )
      .get(slug.trim().toLowerCase()),
  )
}

export function updateUserProfile(
  userId,
  profile,
  { db = defaultDb, now = new Date().toISOString() } = {},
) {
  db.prepare(
    `UPDATE users
    SET display_name = ?, slug = ?, avatar_url = ?, updated_at = ?
    WHERE id = ?`,
  ).run(profile.displayName, profile.slug, profile.avatarUrl, now, userId)

  return findUserById(userId, { db })
}

export function updateUserTheme(
  userId,
  theme,
  { db = defaultDb, now = new Date().toISOString() } = {},
) {
  db.prepare(
    `UPDATE users
    SET theme = ?, updated_at = ?
    WHERE id = ?`,
  ).run(theme, now, userId)

  return findUserById(userId, { db })
}

function mapUser(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    slug: row.slug,
    avatarUrl: row.avatar_url,
    theme: row.theme,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
