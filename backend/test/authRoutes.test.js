import assert from 'node:assert/strict'
import test from 'node:test'

import request from 'supertest'

import {
  createTestDatabase,
  runBackendScript,
} from './helpers/testDatabase.js'

const testDatabase = createTestDatabase()
runBackendScript('migrate.js', testDatabase.path)
process.env.DATABASE_PATH = testDatabase.path
process.env.NODE_ENV = 'test'

const [{ app }, { db }, { hashToken }] = await Promise.all([
  import('../src/app.js'),
  import('../src/database/connection.js'),
  import('../src/services/tokenService.js'),
])

test.after(() => {
  db.close()
  testDatabase.cleanup()
})

test('POST /api/auth/register creates a user and returns a bearer token', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'register@example.com',
      password: 'Senha123!',
      displayName: 'Register User',
      slug: 'register-user',
    })
    .expect(201)

  assert.equal(typeof response.body.token, 'string')
  assert.equal(response.body.user.email, 'register@example.com')
  assert.equal(response.body.user.displayName, 'Register User')
  assert.equal(response.body.user.slug, 'register-user')
  assert.equal(response.body.user.passwordHash, undefined)
})

test('POST /api/auth/login verifies credentials and returns a new token', async () => {
  await registerUser({
    email: 'login@example.com',
    slug: 'login-user',
  })

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'login@example.com', password: 'Senha123!' })
    .expect(200)

  assert.equal(typeof response.body.token, 'string')
  assert.equal(response.body.user.email, 'login@example.com')
})

test('POST /api/auth/login rejects wrong passwords', async () => {
  await registerUser({
    email: 'wrong-password@example.com',
    slug: 'wrong-password-user',
  })

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'wrong-password@example.com', password: 'Senha1234!' })
    .expect(401)

  assert.equal(response.body.code, 'AUTHENTICATION_REQUIRED')
})

test('auth routes reject duplicate email and slug', async () => {
  await registerUser({
    email: 'duplicate@example.com',
    slug: 'duplicate-user',
  })

  const duplicateEmail = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'DUPLICATE@example.com',
      password: 'Senha123!',
      displayName: 'Duplicate Email',
      slug: 'duplicate-email-user',
    })
    .expect(409)

  const duplicateSlug = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'duplicate-slug@example.com',
      password: 'Senha123!',
      displayName: 'Duplicate Slug',
      slug: 'DUPLICATE-user',
    })
    .expect(409)

  assert.equal(duplicateEmail.body.fields.email, 'already_in_use')
  assert.equal(duplicateSlug.body.fields.slug, 'already_in_use')
})

test('GET /api/auth/me returns the current user for a valid token', async () => {
  const { token } = await registerUser({
    email: 'me@example.com',
    slug: 'me-user',
  })

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  assert.equal(response.body.user.email, 'me@example.com')
  assert.equal(response.body.user.passwordHash, undefined)
})

test('auth middleware rejects missing and invalid bearer tokens', async () => {
  const missingToken = await request(app).get('/api/auth/me').expect(401)
  const invalidToken = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer not-a-real-token')
    .expect(401)

  assert.equal(missingToken.body.code, 'AUTHENTICATION_REQUIRED')
  assert.equal(invalidToken.body.code, 'AUTHENTICATION_REQUIRED')
})

test('auth middleware rejects expired tokens', async () => {
  const { token } = await registerUser({
    email: 'expired@example.com',
    slug: 'expired-user',
  })

  db.prepare('UPDATE auth_tokens SET expires_at = ? WHERE token_hash = ?').run(
    '2020-01-01T00:00:00.000Z',
    hashToken(token),
  )

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)

  assert.equal(response.body.code, 'AUTHENTICATION_REQUIRED')
})

test('POST /api/auth/logout invalidates the current token', async () => {
  const { token } = await registerUser({
    email: 'logout@example.com',
    slug: 'logout-user',
  })

  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  assert.deepEqual(logout.body, { success: true })

  await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
})

test('auth tokens are not stored in plaintext', async () => {
  const { token } = await registerUser({
    email: 'stored-token@example.com',
    slug: 'stored-token-user',
  })
  const stored = db
    .prepare('SELECT token_hash FROM auth_tokens WHERE token_hash = ?')
    .get(hashToken(token))

  assert.equal(stored.token_hash, hashToken(token))
  assert.notEqual(stored.token_hash, token)
})

async function registerUser(overrides = {}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: overrides.email,
      password: overrides.password ?? 'Senha123!',
      displayName: overrides.displayName ?? 'Test User',
      slug: overrides.slug,
    })
    .expect(201)

  return response.body
}
