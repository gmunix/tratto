import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(__dirname, '../..')

export function createTestDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'tratto-test-'))
  const databasePath = join(directory, 'test.sqlite')

  return {
    path: databasePath,
    cleanup() {
      rmSync(directory, { recursive: true, force: true })
    },
  }
}

export function runBackendScript(scriptName, databasePath) {
  return execFileSync(process.execPath, [`scripts/${scriptName}`], {
    cwd: backendRoot,
    env: {
      ...process.env,
      DATABASE_PATH: databasePath,
      NODE_ENV: 'test',
    },
    encoding: 'utf8',
  })
}

export function openTestDatabase(databasePath) {
  const db = new Database(databasePath, { readonly: true })
  db.pragma('foreign_keys = ON')
  return db
}

export function openWritableTestDatabase(databasePath) {
  const db = new Database(databasePath)
  db.pragma('foreign_keys = ON')
  return db
}
