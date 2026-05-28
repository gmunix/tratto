import { rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

import { environment } from '../src/config/environment.js'

rmSync(environment.databasePath, { force: true })

execFileSync(process.execPath, ['scripts/seed.js'], { stdio: 'inherit' })
