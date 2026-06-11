import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createTestDatabase,
  openTestDatabase,
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
