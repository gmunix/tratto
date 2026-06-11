import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  createTestDatabase,
  openTestDatabase,
  openWritableTestDatabase,
  runBackendScript,
} from './helpers/testDatabase.js'

test('database migrations run against an isolated SQLite file', () => {
  const testDatabase = createTestDatabase()

  try {
    runBackendScript('migrate.js', testDatabase.path)

    const db = openTestDatabase(testDatabase.path)
    const migration = db
      .prepare('SELECT filename FROM schema_migrations WHERE filename = ?')
      .get('001_init.sql')
    const trattosTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get('trattos')

    db.close()

    assert.equal(migration.filename, '001_init.sql')
    assert.equal(trattosTable.name, 'trattos')
  } finally {
    testDatabase.cleanup()
  }
})

test('database reset rebuilds and seeds an isolated SQLite file', () => {
  const testDatabase = createTestDatabase()

  try {
    runBackendScript('resetDatabase.js', testDatabase.path)

    const db = openTestDatabase(testDatabase.path)
    const result = db.prepare('SELECT COUNT(*) AS count FROM trattos').get()

    db.close()

    assert.equal(result.count, 5)
  } finally {
    testDatabase.cleanup()
  }
})

test('seed data backfills user-aware Tratto relationships', () => {
  const testDatabase = createTestDatabase()

  try {
    runBackendScript('resetDatabase.js', testDatabase.path)

    const db = openTestDatabase(testDatabase.path)
    const tratto = db
      .prepare(
        `SELECT creator_id, community_id, rules_json
        FROM trattos
        WHERE id = 'trt-0001'`,
      )
      .get()
    const participant = db
      .prepare(
        `SELECT user_id, invited_by_user_id, invited_at
        FROM tratto_participants
        WHERE id = 'trt-0001-julia'`,
      )
      .get()
    const creatorParticipant = db
      .prepare(
        `SELECT user_id, invited_by_user_id, invited_at
        FROM tratto_participants
        WHERE id = 'trt-0001-marcos'`,
      )
      .get()
    const evidence = db
      .prepare("SELECT author_user_id FROM evidences WHERE id = 'ev-001'")
      .get()

    db.close()

    assert.equal(tratto.creator_id, 'usr-marcos')
    assert.equal(tratto.community_id, 'com-republica-404')
    assert.equal(JSON.parse(tratto.rules_json).length, 4)
    assert.equal(participant.user_id, 'usr-julia')
    assert.equal(participant.invited_by_user_id, 'usr-marcos')
    assert.equal(participant.invited_at, '2026-05-01T12:00:00.000Z')
    assert.equal(creatorParticipant.user_id, 'usr-marcos')
    assert.equal(creatorParticipant.invited_by_user_id, null)
    assert.equal(creatorParticipant.invited_at, '2026-05-01T12:00:00.000Z')
    assert.equal(evidence.author_user_id, 'usr-marcos')
  } finally {
    testDatabase.cleanup()
  }
})

test('migration leaves participant user_id null for duplicate display names', () => {
  const testDatabase = createTestDatabase()

  try {
    const db = openWritableTestDatabase(testDatabase.path)
    applyMigrationsThrough003(db)
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, slug)
      VALUES
        ('usr-dup-1', 'dup1@example.com', 'hash', 'Duplicated Name', 'dup-one'),
        ('usr-dup-2', 'dup2@example.com', 'hash', 'Duplicated Name', 'dup-two')`,
    ).run()
    db.prepare(
      `INSERT INTO trattos (id, case_number, title)
      VALUES ('trt-dup', 'TRT-DUP', 'Duplicate Display')`,
    ).run()
    db.prepare(
      `INSERT INTO tratto_participants (id, tratto_id, display_name, role)
      VALUES ('trt-dup-participant', 'trt-dup', 'Duplicated Name', 'participant')`,
    ).run()
    db.close()

    runBackendScript('migrate.js', testDatabase.path)

    const migratedDb = openTestDatabase(testDatabase.path)
    const participant = migratedDb
      .prepare("SELECT user_id FROM tratto_participants WHERE id = 'trt-dup-participant'")
      .get()

    migratedDb.close()

    assert.equal(participant.user_id, null)
  } finally {
    testDatabase.cleanup()
  }
})

function applyMigrationsThrough003(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  for (const fileName of [
    '001_init.sql',
    '002_users_auth_tokens.sql',
    '003_communities_memberships.sql',
  ]) {
    db.exec(readFileSync(`database/migrations/${fileName}`, 'utf8'))
    db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(fileName)
  }
}
