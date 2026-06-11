import { randomUUID } from 'node:crypto'

import { environment, parseAuthTokenTtlDays } from '../config/environment.js'
import { db as defaultDb } from '../database/connection.js'
import { generateToken, hashToken } from '../services/tokenService.js'

export function createAuthToken(
  userId,
  {
    db = defaultDb,
    id = randomUUID(),
    token = generateToken(),
    now = new Date(),
    ttlDays = environment.authTokenTtlDays,
  } = {},
) {
  const safeTtlDays = parseAuthTokenTtlDays(ttlDays)
  const createdAt = now.toISOString()
  const expiresAt = new Date(
    now.getTime() + safeTtlDays * 24 * 60 * 60 * 1000,
  ).toISOString()
  const tokenHash = hashToken(token)

  db.prepare(
    `INSERT INTO auth_tokens (
      id,
      user_id,
      token_hash,
      expires_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, userId, tokenHash, expiresAt, createdAt)

  return {
    token,
    authToken: findAuthTokenByHash(tokenHash, { db }),
  }
}

export function findAuthTokenByToken(token, { db = defaultDb } = {}) {
  return findAuthTokenByHash(hashToken(token), { db })
}

export function findAuthTokenByHash(tokenHash, { db = defaultDb } = {}) {
  return mapAuthToken(
    db
      .prepare(
        `SELECT
          id,
          user_id,
          token_hash,
          expires_at,
          created_at,
          last_used_at
        FROM auth_tokens
        WHERE token_hash = ?`,
      )
      .get(tokenHash),
  )
}

export function deleteExpiredAuthTokens(
  { db = defaultDb, now = new Date().toISOString() } = {},
) {
  const result = db.prepare('DELETE FROM auth_tokens WHERE expires_at <= ?').run(now)

  return result.changes
}

function mapAuthToken(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }
}
