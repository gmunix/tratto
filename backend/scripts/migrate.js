import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'

import { environment } from '../src/config/environment.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = resolve(__dirname, '../database/migrations')

mkdirSync(dirname(environment.databasePath), { recursive: true })

const db = new Database(environment.databasePath)
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

const migrationFiles = readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith('.sql'))
  .sort()

const isMigrationApplied = db.prepare(
  'SELECT 1 FROM schema_migrations WHERE filename = ?',
)
const markMigrationApplied = db.prepare(
  'INSERT INTO schema_migrations (filename) VALUES (?)',
)

const applyMigration = db.transaction((fileName, migrationSql) => {
  db.exec(migrationSql)
  markMigrationApplied.run(fileName)
})

for (const fileName of migrationFiles) {
  if (isMigrationApplied.get(fileName)) {
    console.log(`Skipped migration: ${fileName}`)
    continue
  }

  const migrationSql = readFileSync(join(migrationsDir, fileName), 'utf8')

  applyMigration(fileName, migrationSql)
  console.log(`Applied migration: ${fileName}`)
}

db.close()
