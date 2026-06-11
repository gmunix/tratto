import assert from 'node:assert/strict'
import test from 'node:test'

import {
  defaultAuthTokenTtlDays,
  parseAuthTokenTtlDays,
} from '../src/config/environment.js'
import {
  createAuthToken,
  deleteExpiredAuthTokens,
  findAuthTokenByToken,
} from '../src/models/authTokenRepository.js'
import {
  createUser,
  findUserByEmail,
  findUserBySlug,
} from '../src/models/userRepository.js'
import { hashPassword, verifyPassword } from '../src/services/passwordService.js'
import { hashToken } from '../src/services/tokenService.js'
import {
  createTestDatabase,
  openTestDatabase,
  openWritableTestDatabase,
  runBackendScript,
} from './helpers/testDatabase.js'

function migrateTestDatabase() {
  const testDatabase = createTestDatabase()
  runBackendScript('migrate.js', testDatabase.path)

  return testDatabase
}

function insertTestUser(db, overrides = {}) {
  return createUser(
    {
      email: overrides.email ?? 'test@example.com',
      passwordHash: overrides.passwordHash ?? 'scrypt:test-hash',
      displayName: overrides.displayName ?? 'Test User',
      slug: overrides.slug ?? 'testuser',
      theme: overrides.theme,
    },
    {
      db,
      id: overrides.id ?? 'usr-test',
      now: '2026-06-01T12:00:00.000Z',
    },
  )
}

test('users enforce unique email case-insensitively', () => {
  const testDatabase = migrateTestDatabase()

  try {
    const db = openWritableTestDatabase(testDatabase.path)
    insertTestUser(db, { email: 'case@example.com' })

    assert.throws(
      () =>
        insertTestUser(db, {
          id: 'usr-duplicate-email',
          email: 'CASE@example.com',
          slug: 'duplicate-email',
        }),
      /UNIQUE constraint failed: users.email/,
    )

    db.close()
  } finally {
    testDatabase.cleanup()
  }
})

test('users enforce unique slug case-insensitively', () => {
  const testDatabase = migrateTestDatabase()

  try {
    const db = openWritableTestDatabase(testDatabase.path)
    insertTestUser(db, { slug: 'same-slug' })

    assert.throws(
      () =>
        insertTestUser(db, {
          id: 'usr-duplicate-slug',
          email: 'duplicate-slug@example.com',
          slug: 'SAME-SLUG',
        }),
      /UNIQUE constraint failed: users.slug/,
    )

    db.close()
  } finally {
    testDatabase.cleanup()
  }
})

test('user lookup helpers find users by email and slug', () => {
  const testDatabase = migrateTestDatabase()

  try {
    const db = openWritableTestDatabase(testDatabase.path)
    insertTestUser(db, {
      email: 'lookup@example.com',
      displayName: 'Lookup User',
      slug: 'lookupuser',
    })

    assert.equal(
      findUserByEmail('LOOKUP@example.com', { db }).displayName,
      'Lookup User',
    )
    assert.equal(findUserBySlug('LOOKUPUSER', { db }).email, 'lookup@example.com')

    db.close()
  } finally {
    testDatabase.cleanup()
  }
})

test('auth tokens persist only token hashes', () => {
  const testDatabase = migrateTestDatabase()

  try {
    const db = openWritableTestDatabase(testDatabase.path)
    insertTestUser(db)

    const { authToken } = createAuthToken('usr-test', {
      db,
      id: 'tok-test',
      token: 'plain-token-returned-once',
      now: new Date('2026-06-01T12:00:00.000Z'),
      ttlDays: 1,
    })
    const stored = db
      .prepare('SELECT token_hash FROM auth_tokens WHERE id = ?')
      .get('tok-test')

    assert.equal(stored.token_hash, hashToken('plain-token-returned-once'))
    assert.notEqual(stored.token_hash, 'plain-token-returned-once')
    assert.equal(stored.token_hash.length, 64)
    assert.equal(
      findAuthTokenByToken('plain-token-returned-once', { db }).id,
      authToken.id,
    )

    db.close()
  } finally {
    testDatabase.cleanup()
  }
})

test('expired auth token cleanup removes only expired rows', () => {
  const testDatabase = migrateTestDatabase()

  try {
    const db = openWritableTestDatabase(testDatabase.path)
    insertTestUser(db)
    createAuthToken('usr-test', {
      db,
      id: 'tok-expired',
      token: 'expired-token',
      now: new Date('2026-05-01T12:00:00.000Z'),
      ttlDays: 1,
    })
    createAuthToken('usr-test', {
      db,
      id: 'tok-active',
      token: 'active-token',
      now: new Date('2026-06-01T12:00:00.000Z'),
      ttlDays: 30,
    })

    const deletedCount = deleteExpiredAuthTokens({
      db,
      now: '2026-06-11T12:00:00.000Z',
    })
    const remaining = db
      .prepare('SELECT id FROM auth_tokens ORDER BY id')
      .all()
      .map((row) => row.id)

    assert.equal(deletedCount, 1)
    assert.deepEqual(remaining, ['tok-active'])

    db.close()
  } finally {
    testDatabase.cleanup()
  }
})

test('seed data includes stable users and hashed development passwords', async () => {
  const testDatabase = createTestDatabase()

  try {
    runBackendScript('resetDatabase.js', testDatabase.path)

    const db = openTestDatabase(testDatabase.path)
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get()
    const marcos = db
      .prepare(
        `SELECT email, password_hash, display_name, slug, theme
        FROM users
        WHERE id = ?`,
      )
      .get('usr-marcos')

    db.close()

    assert.equal(userCount.count, 11)
    assert.deepEqual(
      {
        email: marcos.email,
        displayName: marcos.display_name,
        slug: marcos.slug,
        theme: marcos.theme,
      },
      {
        email: 'marcos@example.com',
        displayName: 'Marcos Ferreira',
        slug: 'marcosf',
        theme: 'grime',
      },
    )
    assert.match(marcos.password_hash, /^scrypt:/)
    assert.equal(await verifyPassword('Senha123!', marcos.password_hash), true)
  } finally {
    testDatabase.cleanup()
  }
})

test('password hashing stores verifiable hashes instead of plain passwords', async () => {
  const passwordHash = await hashPassword('Senha123!')

  assert.match(passwordHash, /^scrypt:/)
  assert.notEqual(passwordHash, 'Senha123!')
  assert.equal(await verifyPassword('Senha123!', passwordHash), true)
  assert.equal(await verifyPassword('senha-errada', passwordHash), false)
})

test('password verification fails closed for malformed hashes', async () => {
  const malformedHashes = [
    null,
    '',
    'plain-password',
    'scrypt:16384:8:1:abcd:' + 'a'.repeat(128) + ':extra',
    'bcrypt:16384:8:1:abcd:' + 'a'.repeat(128),
    'scrypt:not-a-number:8:1:abcd:' + 'a'.repeat(128),
    'scrypt:0:8:1:abcd:' + 'a'.repeat(128),
    'scrypt:1:8:1:abcd:' + 'a'.repeat(128),
    'scrypt:-1:8:1:abcd:' + 'a'.repeat(128),
    'scrypt:3:8:1:abcd:' + 'a'.repeat(128),
    'scrypt:16384:0:1:abcd:' + 'a'.repeat(128),
    'scrypt:16384:8:0:abcd:' + 'a'.repeat(128),
    'scrypt:16384:8:1:abc:' + 'a'.repeat(128),
    'scrypt:16384:8:1:not-hex:' + 'a'.repeat(128),
    'scrypt:16384:8:1:abcd:not-hex',
    'scrypt:16384:8:1:abcd:' + 'a'.repeat(127),
  ]

  for (const malformedHash of malformedHashes) {
    assert.equal(await verifyPassword('Senha123!', malformedHash), false)
  }
})

test('auth token TTL parsing falls back to a safe default for invalid values', () => {
  assert.equal(parseAuthTokenTtlDays(undefined), defaultAuthTokenTtlDays)
  assert.equal(parseAuthTokenTtlDays('not-a-number'), defaultAuthTokenTtlDays)
  assert.equal(parseAuthTokenTtlDays('0'), defaultAuthTokenTtlDays)
  assert.equal(parseAuthTokenTtlDays('-1'), defaultAuthTokenTtlDays)
  assert.equal(parseAuthTokenTtlDays('Infinity'), defaultAuthTokenTtlDays)
  assert.equal(parseAuthTokenTtlDays('0.5'), 0.5)
  assert.equal(parseAuthTokenTtlDays('14'), 14)
})
