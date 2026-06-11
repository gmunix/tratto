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

test('judgment routes require authentication', async () => {
  await request(app).post('/api/trattos/trt-noauth/request-judgment').send({}).expect(401)
  await request(app).post('/api/trattos/trt-noauth/votes').send({}).expect(401)
  await request(app).post('/api/trattos/trt-noauth/verdict').send({}).expect(401)
  await request(app).post('/api/trattos/trt-noauth/complete').send({}).expect(401)
})

test('POST /api/trattos/:id/request-judgment moves active Tratto to review', async () => {
  const creator = await registerUser({ email: 'rj-creator@example.com', slug: 'rj-creator', displayName: 'RJ Creator' })
  const participant = await registerUser({ email: 'rj-participant@example.com', slug: 'rj-participant', displayName: 'RJ Participant' })

  await insertTratto({ id: 'trt-rj-active', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-rj-active-creator', trattoId: 'trt-rj-active', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-rj-active-participant', trattoId: 'trt-rj-active', user: participant.user })

  const response = await request(app)
    .post('/api/trattos/trt-rj-active/request-judgment')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ reason: 'Provas suficientes.' })
    .expect(200)

  assert.equal(response.body.tratto.status, 'review')

  const notifications = db
    .prepare(`SELECT user_id, type, target_url FROM notifications WHERE target_url = ?`)
    .all('/trattos/trt-rj-active')

  assert.equal(notifications.length, 1)
  assert.equal(notifications[0].user_id, participant.user.id)
  assert.equal(notifications[0].type, 'verdict')
})

test('POST /api/trattos/:id/request-judgment allows accepted judge', async () => {
  const creator = await registerUser({ email: 'rj-judge-creator@example.com', slug: 'rj-judge-creator', displayName: 'RJ Judge Creator' })
  const judge = await registerUser({ email: 'rj-judge@example.com', slug: 'rj-judge', displayName: 'RJ Judge' })

  await insertTratto({ id: 'trt-rj-judge', creatorId: creator.user.id, status: 'active', decisionMethod: 'judge' })
  await insertParticipant({ id: 'trt-rj-judge-creator', trattoId: 'trt-rj-judge', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-rj-judge-judge', trattoId: 'trt-rj-judge', user: judge.user, role: 'judge' })

  const response = await request(app)
    .post('/api/trattos/trt-rj-judge/request-judgment')
    .set('Authorization', `Bearer ${judge.token}`)
    .send({})
    .expect(200)

  assert.equal(response.body.tratto.status, 'review')
})

test('POST /api/trattos/:id/request-judgment rejects unrelated users and invalid status', async () => {
  const creator = await registerUser({ email: 'rj-bad-creator@example.com', slug: 'rj-bad-creator', displayName: 'RJ Bad Creator' })
  const outsider = await registerUser({ email: 'rj-outsider@example.com', slug: 'rj-outsider', displayName: 'RJ Outsider' })

  await insertTratto({ id: 'trt-rj-bad', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-rj-bad-creator', trattoId: 'trt-rj-bad', user: creator.user, role: 'creator' })

  await request(app)
    .post('/api/trattos/trt-rj-bad/request-judgment')
    .set('Authorization', `Bearer ${outsider.token}`)
    .send({})
    .expect(403)

  await insertTratto({ id: 'trt-rj-pending', creatorId: creator.user.id, status: 'pending', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-rj-pending-creator', trattoId: 'trt-rj-pending', user: creator.user, role: 'creator' })

  await request(app)
    .post('/api/trattos/trt-rj-pending/request-judgment')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({})
    .expect(409)

  await request(app)
    .post('/api/trattos/missing-tratto/request-judgment')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({})
    .expect(404)
})

test('POST /api/trattos/:id/votes stores a vote and upserts on second submission', async () => {
  const creator = await registerUser({ email: 'vote-creator@example.com', slug: 'vote-creator', displayName: 'Vote Creator' })
  const opponent = await registerUser({ email: 'vote-opponent@example.com', slug: 'vote-opponent', displayName: 'Vote Opponent' })

  await insertTratto({ id: 'trt-vote', creatorId: creator.user.id, status: 'review', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-vote-creator', trattoId: 'trt-vote', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-vote-opponent', trattoId: 'trt-vote', user: opponent.user })

  const first = await request(app)
    .post('/api/trattos/trt-vote/votes')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ value: 'winner', votedForParticipantId: 'trt-vote-opponent', reason: 'Mais consistente.' })
    .expect(201)

  assert.equal(first.body.vote.votedForParticipantId, 'trt-vote-opponent')

  const second = await request(app)
    .post('/api/trattos/trt-vote/votes')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ value: 'winner', votedForParticipantId: 'trt-vote-creator', reason: 'Mudei de ideia.' })
    .expect(200)

  assert.equal(second.body.vote.votedForParticipantId, 'trt-vote-creator')

  const rows = db.prepare(`SELECT * FROM votes WHERE tratto_id = 'trt-vote'`).all()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].voted_for_participant_id, 'trt-vote-creator')
  assert.equal(rows[0].reason, 'Mudei de ideia.')
})

test('POST /api/trattos/:id/votes rejects non-participants, non-vote methods, and bad payloads', async () => {
  const creator = await registerUser({ email: 'vote-bad-creator@example.com', slug: 'vote-bad-creator', displayName: 'Vote Bad Creator' })
  const opponent = await registerUser({ email: 'vote-bad-opponent@example.com', slug: 'vote-bad-opponent', displayName: 'Vote Bad Opponent' })
  const outsider = await registerUser({ email: 'vote-bad-outsider@example.com', slug: 'vote-bad-outsider', displayName: 'Vote Bad Outsider' })
  const judge = await registerUser({ email: 'vote-bad-judge@example.com', slug: 'vote-bad-judge', displayName: 'Vote Bad Judge' })

  await insertTratto({ id: 'trt-vote-judge', creatorId: creator.user.id, status: 'review', decisionMethod: 'judge' })
  await insertParticipant({ id: 'trt-vj-creator', trattoId: 'trt-vote-judge', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-vj-judge', trattoId: 'trt-vote-judge', user: judge.user, role: 'judge' })

  await request(app)
    .post('/api/trattos/trt-vote-judge/votes')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ value: 'winner', votedForParticipantId: 'trt-vj-creator' })
    .expect(409)

  await insertTratto({ id: 'trt-vote-pending', creatorId: creator.user.id, status: 'pending', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-vp-creator', trattoId: 'trt-vote-pending', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-vp-opponent', trattoId: 'trt-vote-pending', user: opponent.user })

  await request(app)
    .post('/api/trattos/trt-vote-pending/votes')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ value: 'winner', votedForParticipantId: 'trt-vp-opponent' })
    .expect(409)

  await insertTratto({ id: 'trt-vote-outsider', creatorId: creator.user.id, status: 'review', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-vo-creator', trattoId: 'trt-vote-outsider', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-vo-opponent', trattoId: 'trt-vote-outsider', user: opponent.user })

  await request(app)
    .post('/api/trattos/trt-vote-outsider/votes')
    .set('Authorization', `Bearer ${outsider.token}`)
    .send({ value: 'winner', votedForParticipantId: 'trt-vo-opponent' })
    .expect(403)

  await request(app)
    .post('/api/trattos/trt-vote-outsider/votes')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ value: 'invalid', votedForParticipantId: 'trt-vo-opponent' })
    .expect(400)

  await request(app)
    .post('/api/trattos/trt-vote-outsider/votes')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ value: 'winner', votedForParticipantId: 'missing' })
    .expect(400)
})

test('POST /api/trattos/:id/verdict by judge moves Tratto to compliance', async () => {
  const creator = await registerUser({ email: 'verdict-creator@example.com', slug: 'verdict-creator', displayName: 'Verdict Creator' })
  const opponent = await registerUser({ email: 'verdict-opponent@example.com', slug: 'verdict-opponent', displayName: 'Verdict Opponent' })
  const judge = await registerUser({ email: 'verdict-judge@example.com', slug: 'verdict-judge', displayName: 'Verdict Judge' })

  await insertTratto({ id: 'trt-verdict-judge', creatorId: creator.user.id, status: 'review', decisionMethod: 'judge' })
  await insertParticipant({ id: 'trt-verdict-creator', trattoId: 'trt-verdict-judge', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-verdict-opponent', trattoId: 'trt-verdict-judge', user: opponent.user })
  await insertParticipant({ id: 'trt-verdict-judge-p', trattoId: 'trt-verdict-judge', user: judge.user, role: 'judge' })

  await request(app)
    .post('/api/trattos/trt-verdict-judge/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({
      winnerParticipantId: 'trt-verdict-creator',
      loserParticipantId: 'trt-verdict-opponent',
      summary: 'Tentei eu mesmo.',
    })
    .expect(403)

  const response = await request(app)
    .post('/api/trattos/trt-verdict-judge/verdict')
    .set('Authorization', `Bearer ${judge.token}`)
    .send({
      winnerParticipantId: 'trt-verdict-creator',
      loserParticipantId: 'trt-verdict-opponent',
      summary: 'Após análise das evidências.',
    })
    .expect(201)

  assert.equal(response.body.tratto.status, 'compliance')

  const verdict = db.prepare(`SELECT * FROM tratto_verdicts WHERE tratto_id = 'trt-verdict-judge'`).get()
  assert.equal(verdict.winner_participant_id, 'trt-verdict-creator')
  assert.equal(verdict.loser_participant_id, 'trt-verdict-opponent')

  const notifications = db
    .prepare(`SELECT user_id, type FROM notifications WHERE target_url = '/trattos/trt-verdict-judge'`)
    .all()
  assert.equal(notifications.length, 2)
  assert.ok(notifications.every((row) => row.type === 'verdict'))
})

test('POST /api/trattos/:id/verdict by creator works for vote and mutual methods', async () => {
  const creator = await registerUser({ email: 'verdict-vc@example.com', slug: 'verdict-vc', displayName: 'Verdict VC' })
  const opponent = await registerUser({ email: 'verdict-vo@example.com', slug: 'verdict-vo', displayName: 'Verdict VO' })

  await insertTratto({ id: 'trt-verdict-vote', creatorId: creator.user.id, status: 'review', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-vv-creator', trattoId: 'trt-verdict-vote', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-vv-opponent', trattoId: 'trt-verdict-vote', user: opponent.user })

  const response = await request(app)
    .post('/api/trattos/trt-verdict-vote/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({
      winnerParticipantId: 'trt-vv-opponent',
      loserParticipantId: 'trt-vv-creator',
      summary: 'Resultado da votação.',
    })
    .expect(201)

  assert.equal(response.body.tratto.status, 'compliance')
})

test('POST /api/trattos/:id/verdict rejects invalid payloads and duplicates', async () => {
  const creator = await registerUser({ email: 'verdict-bad-creator@example.com', slug: 'verdict-bad-creator', displayName: 'Verdict Bad Creator' })
  const opponent = await registerUser({ email: 'verdict-bad-opponent@example.com', slug: 'verdict-bad-opponent', displayName: 'Verdict Bad Opponent' })

  await insertTratto({ id: 'trt-verdict-active', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-va-creator', trattoId: 'trt-verdict-active', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-va-opponent', trattoId: 'trt-verdict-active', user: opponent.user })

  await request(app)
    .post('/api/trattos/trt-verdict-active/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ winnerParticipantId: 'trt-va-creator', loserParticipantId: 'trt-va-opponent' })
    .expect(409)

  await insertTratto({ id: 'trt-verdict-bad', creatorId: creator.user.id, status: 'review', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-vb-creator', trattoId: 'trt-verdict-bad', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-vb-opponent', trattoId: 'trt-verdict-bad', user: opponent.user })

  await request(app)
    .post('/api/trattos/trt-verdict-bad/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ winnerParticipantId: '', loserParticipantId: 'trt-vb-opponent' })
    .expect(400)

  await request(app)
    .post('/api/trattos/trt-verdict-bad/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ winnerParticipantId: 'trt-vb-creator', loserParticipantId: 'trt-vb-creator' })
    .expect(400)

  await request(app)
    .post('/api/trattos/trt-verdict-bad/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ winnerParticipantId: 'trt-vb-creator', loserParticipantId: 'missing-id' })
    .expect(400)

  await request(app)
    .post('/api/trattos/trt-verdict-bad/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ winnerParticipantId: 'trt-vb-creator', loserParticipantId: 'trt-vb-opponent' })
    .expect(201)

  await request(app)
    .post('/api/trattos/trt-verdict-bad/verdict')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ winnerParticipantId: 'trt-vb-creator', loserParticipantId: 'trt-vb-opponent' })
    .expect(409)
})

test('POST /api/trattos/:id/complete moves compliance to finished for creator only', async () => {
  const creator = await registerUser({ email: 'complete-creator@example.com', slug: 'complete-creator', displayName: 'Complete Creator' })
  const opponent = await registerUser({ email: 'complete-opponent@example.com', slug: 'complete-opponent', displayName: 'Complete Opponent' })

  await insertTratto({ id: 'trt-complete', creatorId: creator.user.id, status: 'compliance', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-cp-creator', trattoId: 'trt-complete', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-cp-opponent', trattoId: 'trt-complete', user: opponent.user })

  await request(app)
    .post('/api/trattos/trt-complete/complete')
    .set('Authorization', `Bearer ${opponent.token}`)
    .send({})
    .expect(403)

  const response = await request(app)
    .post('/api/trattos/trt-complete/complete')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({})
    .expect(200)

  assert.equal(response.body.tratto.status, 'finished')

  const trattoRow = db.prepare(`SELECT status, resolved_at FROM trattos WHERE id = 'trt-complete'`).get()
  assert.equal(trattoRow.status, 'finished')
  assert.ok(trattoRow.resolved_at)

  await insertTratto({ id: 'trt-complete-active', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-ca-creator', trattoId: 'trt-complete-active', user: creator.user, role: 'creator' })

  await request(app)
    .post('/api/trattos/trt-complete-active/complete')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({})
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
    overrides.title ?? 'Judgment Test',
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
