import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'

import { environment } from '../src/config/environment.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedPath = resolve(__dirname, '../database/seeds/development.sql')

mkdirSync(dirname(environment.databasePath), { recursive: true })

execFileSync(process.execPath, ['scripts/migrate.js'], { stdio: 'inherit' })

const db = new Database(environment.databasePath)
db.pragma('foreign_keys = ON')

const seedSql = readFileSync(seedPath, 'utf8')

const seedDatabase = db.transaction(() => {
  db.exec(seedSql)
})

seedDatabase()
db.close()

console.log('Database seeded')
