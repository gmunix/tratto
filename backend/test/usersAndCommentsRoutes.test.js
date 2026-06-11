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

test('users and comments routes require authentication', async () => {
  await request(app).get('/api/users?query=foo').expect(401)
  await request(app).post('/api/trattos/trt-noauth/comments').send({}).expect(401)
})

test('GET /api/users searches by slug and display name', async () => {
  const searcher = await registerUser({ email: 'search-actor@example.com', slug: 'search-actor', displayName: 'Search Actor' })
  await registerUser({ email: 'search-alpha@example.com', slug: 'search-alpha', displayName: 'Alpha Person' })
  await registerUser({ email: 'search-bravo@example.com', slug: 'search-bravo', displayName: 'Bravo Helper' })
  await registerUser({ email: 'search-alpha-2@example.com', slug: 'search-alpha-other', displayName: 'Different Alpha' })

  const exact = await request(app)
    .get('/api/users?query=search-alpha')
    .set('Authorization', `Bearer ${searcher.token}`)
    .expect(200)

  assert.ok(exact.body.users.some((row) => row.slug === 'search-alpha'))
  assert.ok(exact.body.users.some((row) => row.slug === 'search-alpha-other'))
  assert.equal(exact.body.users[0].slug, 'search-alpha')

  const byName = await request(app)
    .get('/api/users?query=bravo')
    .set('Authorization', `Bearer ${searcher.token}`)
    .expect(200)

  assert.ok(byName.body.users.some((row) => row.displayName === 'Bravo Helper'))

  const short = await request(app)
    .get('/api/users?query=a')
    .set('Authorization', `Bearer ${searcher.token}`)
    .expect(200)

  assert.deepEqual(short.body.users, [])
})

test('POST /api/trattos/:id/comments accepts comments from accepted participants and notifies others', async () => {
  const creator = await registerUser({ email: 'comment-creator@example.com', slug: 'comment-creator', displayName: 'Comment Creator' })
  const participant = await registerUser({ email: 'comment-participant@example.com', slug: 'comment-participant', displayName: 'Comment Participant' })
  const mentioned = await registerUser({ email: 'comment-mentioned@example.com', slug: 'comment-mentioned', displayName: 'Comment Mentioned' })

  await insertTratto({ id: 'trt-comment', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-comment-creator', trattoId: 'trt-comment', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-comment-participant', trattoId: 'trt-comment', user: participant.user })
  await insertParticipant({ id: 'trt-comment-mentioned', trattoId: 'trt-comment', user: mentioned.user })

  const response = await request(app)
    .post('/api/trattos/trt-comment/comments')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ content: 'Atenção @comment-mentioned, sua presença é solicitada.' })
    .expect(201)

  assert.equal(response.body.comment.author.slug, 'comment-creator')
  assert.equal(response.body.tratto.comments.length, 1)

  const notificationRows = db
    .prepare(`SELECT user_id, type FROM notifications WHERE target_url = '/trattos/trt-comment' ORDER BY user_id, type`)
    .all()

  const byUser = new Map()
  for (const row of notificationRows) {
    const list = byUser.get(row.user_id) ?? []
    list.push(row.type)
    byUser.set(row.user_id, list)
  }

  assert.ok(byUser.get(participant.user.id)?.includes('evidence'))
  assert.ok(byUser.get(mentioned.user.id)?.includes('evidence'))
  assert.ok(byUser.get(mentioned.user.id)?.includes('mention'))
  assert.equal(byUser.has(creator.user.id), false)
})

test('POST /api/trattos/:id/comments rejects non-participants, finished Trattos, and empty content', async () => {
  const creator = await registerUser({ email: 'comment-bad-creator@example.com', slug: 'comment-bad-creator', displayName: 'Comment Bad Creator' })
  const outsider = await registerUser({ email: 'comment-bad-outsider@example.com', slug: 'comment-bad-outsider', displayName: 'Comment Bad Outsider' })

  await insertTratto({ id: 'trt-comment-active', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-ca-creator', trattoId: 'trt-comment-active', user: creator.user, role: 'creator' })

  await request(app)
    .post('/api/trattos/trt-comment-active/comments')
    .set('Authorization', `Bearer ${outsider.token}`)
    .send({ content: 'Quero opinar.' })
    .expect(403)

  await request(app)
    .post('/api/trattos/trt-comment-active/comments')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ content: '' })
    .expect(400)

  await insertTratto({ id: 'trt-comment-finished', creatorId: creator.user.id, status: 'finished', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-cf-creator', trattoId: 'trt-comment-finished', user: creator.user, role: 'creator' })

  await request(app)
    .post('/api/trattos/trt-comment-finished/comments')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ content: 'Tentando comentar.' })
    .expect(409)
})

async function registerUser(overrides = {}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: overrides.email,
      password: 'Senha123!',
      displayName: overrides.displayName ?? 'Test User',
      slug: overrides.slug,
    })
    .expect(201)

  return response.body
}

async function insertTratto(overrides) {
  db.prepare(
    `INSERT INTO trattos (
      id,
      case_number,
      title,
      description,
      category,
      consequence,
      rules,
      rules_json,
      status,
      deadline,
      decision_method,
      creator_id,
      community_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    overrides.id,
    overrides.caseNumber ?? overrides.id.toUpperCase(),
    overrides.title ?? 'Comment Test',
    overrides.description ?? 'Description',
    overrides.category ?? 'Teste',
    overrides.consequence ?? 'Consequence',
    overrides.rules ?? '1. Primeira regra.',
    overrides.rulesJson ?? '[{"id":"rule-1","text":"Primeira regra.","position":1}]',
    overrides.status ?? 'pending',
    overrides.deadline ?? '2026-06-30',
    overrides.decisionMethod ?? 'vote',
    overrides.creatorId,
    overrides.communityId ?? null,
    overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
    overrides.updatedAt ?? '2026-06-01T12:00:00.000Z',
  )
}

async function insertParticipant(overrides) {
  db.prepare(
    `INSERT INTO tratto_participants (
      id,
      tratto_id,
      display_name,
      role,
      invite_status,
      accepted_at,
      created_at,
      user_id,
      invited_by_user_id,
      invited_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    overrides.id,
    overrides.trattoId,
    overrides.user.displayName,
    overrides.role ?? 'participant',
    overrides.inviteStatus ?? 'accepted',
    overrides.acceptedAt ?? '2026-06-01T12:00:00.000Z',
    overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
    overrides.user.id,
    overrides.invitedByUserId ?? null,
    overrides.invitedAt ?? '2026-06-01T12:00:00.000Z',
  )
}
