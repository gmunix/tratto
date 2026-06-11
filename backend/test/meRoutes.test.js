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

const [{ app }, { db }] = await Promise.all([
  import('../src/app.js'),
  import('../src/database/connection.js'),
])

test.after(() => {
  db.close()
  testDatabase.cleanup()
})

test('PATCH /api/me requires authentication', async () => {
  const response = await request(app).patch('/api/me').send({ displayName: 'No Auth' }).expect(401)
  const themeResponse = await request(app)
    .patch('/api/me/theme')
    .send({ theme: 'cassete' })
    .expect(401)

  assert.equal(response.body.code, 'AUTHENTICATION_REQUIRED')
  assert.equal(themeResponse.body.code, 'AUTHENTICATION_REQUIRED')
})

test('PATCH /api/me updates displayName, slug, and avatarUrl', async () => {
  const { token } = await registerUser({ email: 'profile@example.com', slug: 'profile-user' })

  const response = await request(app)
    .patch('/api/me')
    .set('Authorization', `Bearer ${token}`)
    .send({
      displayName: 'Updated Profile',
      slug: 'updated-profile',
      avatarUrl: 'https://example.com/avatar.png',
    })
    .expect(200)

  assert.equal(response.body.user.displayName, 'Updated Profile')
  assert.equal(response.body.user.slug, 'updated-profile')
  assert.equal(response.body.user.avatarUrl, 'https://example.com/avatar.png')
  assert.equal(response.body.user.passwordHash, undefined)
})

test('PATCH /api/me rejects duplicate slugs', async () => {
  await registerUser({ email: 'owner@example.com', slug: 'taken-slug' })
  const { token } = await registerUser({ email: 'other@example.com', slug: 'other-user' })

  const response = await request(app)
    .patch('/api/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ slug: 'TAKEN-slug' })
    .expect(409)

  assert.equal(response.body.fields.slug, 'already_in_use')
})

test('PATCH /api/me/theme rejects invalid themes', async () => {
  const { token } = await registerUser({ email: 'invalid-theme@example.com', slug: 'invalid-theme' })

  const response = await request(app)
    .patch('/api/me/theme')
    .set('Authorization', `Bearer ${token}`)
    .send({ theme: 'neon' })
    .expect(400)

  assert.equal(response.body.fields.theme, 'invalid')
})

test('PATCH /api/me/theme persists and GET /api/auth/me returns the new theme', async () => {
  const [{ token }, other] = await Promise.all([
    registerUser({ email: 'theme@example.com', slug: 'theme-user' }),
    registerUser({ email: 'theme-other@example.com', slug: 'theme-other' }),
  ])

  const themeResponse = await request(app)
    .patch('/api/me/theme')
    .set('Authorization', `Bearer ${token}`)
    .send({ theme: 'cassete' })
    .expect(200)

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  const otherResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${other.token}`)
    .expect(200)

  assert.equal(themeResponse.body.user.theme, 'cassete')
  assert.equal(meResponse.body.user.theme, 'cassete')
  assert.equal(otherResponse.body.user.theme, 'grime')
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
