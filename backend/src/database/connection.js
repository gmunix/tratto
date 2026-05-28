import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import Database from 'better-sqlite3'

import { environment } from '../config/environment.js'

mkdirSync(dirname(environment.databasePath), { recursive: true })

export const db = new Database(environment.databasePath)

db.pragma('foreign_keys = ON')
