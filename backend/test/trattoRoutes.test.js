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

test('tratto routes require authentication', async () => {
  await request(app).get('/api/trattos').expect(401)
  await request(app).get('/api/trattos/trt-auth').expect(401)
  await request(app).post('/api/trattos').send({}).expect(401)
})

test('GET /api/trattos returns visible Trattos and hides unrelated private records', async () => {
  const owner = await registerUser({ email: 'visible-owner@example.com', slug: 'visible-owner', displayName: 'Visible Owner' })
  const invited = await registerUser({ email: 'visible-invited@example.com', slug: 'visible-invited', displayName: 'Visible Invited' })
  const outsider = await registerUser({ email: 'visible-outsider@example.com', slug: 'visible-outsider', displayName: 'Visible Outsider' })
  const member = await registerUser({ email: 'visible-member@example.com', slug: 'visible-member', displayName: 'Visible Member' })
  const pendingMember = await registerUser({ email: 'visible-pending@example.com', slug: 'visible-pending', displayName: 'Visible Pending' })
  const deniedMember = await registerUser({ email: 'visible-denied@example.com', slug: 'visible-denied', displayName: 'Visible Denied' })
  const removedMember = await registerUser({ email: 'visible-removed@example.com', slug: 'visible-removed', displayName: 'Visible Removed' })

  await insertCommunity({ id: 'com-visible', slug: 'visible-community', creatorId: owner.user.id })
  await insertMembership({ id: 'mem-visible-member', communityId: 'com-visible', userId: member.user.id })
  await insertMembership({ id: 'mem-visible-pending', communityId: 'com-visible', userId: pendingMember.user.id, status: 'pending' })
  await insertMembership({ id: 'mem-visible-denied', communityId: 'com-visible', userId: deniedMember.user.id, status: 'denied' })
  await insertMembership({ id: 'mem-visible-removed', communityId: 'com-visible', userId: removedMember.user.id, status: 'removed' })
  await insertTratto({ id: 'trt-created', creatorId: owner.user.id, title: 'Created visible' })
  await insertParticipant({ id: 'trt-created-owner', trattoId: 'trt-created', user: owner.user, role: 'creator' })
  await insertTratto({ id: 'trt-invited', creatorId: outsider.user.id, title: 'Invited visible' })
  await insertParticipant({ id: 'trt-invited-outsider', trattoId: 'trt-invited', user: outsider.user, role: 'creator' })
  await insertParticipant({ id: 'trt-invited-user', trattoId: 'trt-invited', user: invited.user })
  await insertTratto({
    id: 'trt-community-visible',
    creatorId: owner.user.id,
    title: 'Community visible',
    communityId: 'com-visible',
  })
  await insertParticipant({ id: 'trt-community-owner', trattoId: 'trt-community-visible', user: owner.user, role: 'creator' })
  await insertTratto({ id: 'trt-hidden', creatorId: outsider.user.id, title: 'Hidden private' })
  await insertParticipant({ id: 'trt-hidden-outsider', trattoId: 'trt-hidden', user: outsider.user, role: 'creator' })

  const ownerResponse = await request(app)
    .get('/api/trattos')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)
  const invitedResponse = await request(app)
    .get('/api/trattos')
    .set('Authorization', `Bearer ${invited.token}`)
    .expect(200)
  const memberResponse = await request(app)
    .get('/api/trattos')
    .set('Authorization', `Bearer ${member.token}`)
    .expect(200)
  const pendingResponse = await request(app)
    .get('/api/trattos')
    .set('Authorization', `Bearer ${pendingMember.token}`)
    .expect(200)
  const deniedResponse = await request(app)
    .get('/api/trattos')
    .set('Authorization', `Bearer ${deniedMember.token}`)
    .expect(200)
  const removedResponse = await request(app)
    .get('/api/trattos')
    .set('Authorization', `Bearer ${removedMember.token}`)
    .expect(200)

  assert.deepEqual(ids(ownerResponse), ['trt-community-visible', 'trt-created'])
  assert.deepEqual(ids(invitedResponse), ['trt-invited'])
  assert.deepEqual(ids(memberResponse), ['trt-community-visible'])
  assert.deepEqual(ids(pendingResponse), [])
  assert.deepEqual(ids(deniedResponse), [])
  assert.deepEqual(ids(removedResponse), [])
  assert.equal(ownerResponse.body.stats.pending, 2)
})

test('GET /api/trattos/:id returns rules and permissions', async () => {
  const creator = await registerUser({ email: 'detail-creator@example.com', slug: 'detail-creator', displayName: 'Detail Creator' })
  const participant = await registerUser({ email: 'detail-participant@example.com', slug: 'detail-participant', displayName: 'Detail Participant' })
  await insertTratto({ id: 'trt-detail', creatorId: creator.user.id, title: 'Detail Tratto', status: 'active' })
  await insertParticipant({ id: 'trt-detail-creator', trattoId: 'trt-detail', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-detail-participant', trattoId: 'trt-detail', user: participant.user })

  const response = await request(app)
    .get('/api/trattos/trt-detail')
    .set('Authorization', `Bearer ${participant.token}`)
    .expect(200)

  assert.deepEqual(response.body.tratto.rules, [
    { id: 'rule-1', text: 'Primeira regra.', position: 1 },
    { id: 'rule-2', text: 'Segunda regra.', position: 2 },
  ])
  assert.deepEqual(response.body.tratto.permissions, {
    canEdit: false,
    canAddEvidence: true,
    canRequestJudgment: true,
    canVote: true,
    canResolveVerdict: false,
    canComplete: false,
  })
})

test('GET /api/trattos/:id allows accepted judges to request judgment', async () => {
  const creator = await registerUser({ email: 'judge-creator@example.com', slug: 'judge-creator', displayName: 'Judge Creator' })
  const judge = await registerUser({ email: 'judge-user@example.com', slug: 'judge-user', displayName: 'Judge User' })
  await insertTratto({
    id: 'trt-judge-permissions',
    creatorId: creator.user.id,
    title: 'Judge Permission Tratto',
    status: 'active',
    decisionMethod: 'judge',
  })
  await insertParticipant({ id: 'trt-judge-creator', trattoId: 'trt-judge-permissions', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-judge-user', trattoId: 'trt-judge-permissions', user: judge.user, role: 'judge' })

  const response = await request(app)
    .get('/api/trattos/trt-judge-permissions')
    .set('Authorization', `Bearer ${judge.token}`)
    .expect(200)

  assert.equal(response.body.tratto.permissions.canRequestJudgment, true)
  assert.equal(response.body.tratto.permissions.canResolveVerdict, false)
  assert.equal(response.body.tratto.permissions.canVote, false)
})

test('POST /api/trattos creates standalone Tratto with creator and invited participants', async () => {
  const creator = await registerUser({ email: 'create-creator@example.com', slug: 'create-creator', displayName: 'Create Creator' })
  const participant = await registerUser({ email: 'create-participant@example.com', slug: 'create-participant', displayName: 'Create Participant' })

  const response = await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${creator.token}`)
    .send(createPayload({ participantSlugs: [participant.user.slug] }))
    .expect(201)

  const rows = db
    .prepare(
      `SELECT user_id, role, invite_status, invited_by_user_id
      FROM tratto_participants
      WHERE tratto_id = ?
      ORDER BY role`,
    )
    .all(response.body.tratto.id)

  assert.equal(response.body.tratto.creator.id, creator.user.id)
  assert.equal(response.body.tratto.community, null)
  assert.deepEqual(response.body.tratto.participantNames, ['Create Creator', 'Create Participant'])
  assert.deepEqual(rows, [
    {
      user_id: creator.user.id,
      role: 'creator',
      invite_status: 'accepted',
      invited_by_user_id: null,
    },
    {
      user_id: participant.user.id,
      role: 'participant',
      invite_status: 'pending',
      invited_by_user_id: creator.user.id,
    },
  ])
})

test('POST /api/trattos rejects duplicate participant display names', async () => {
  const creator = await registerUser({ email: 'duplicate-name-creator@example.com', slug: 'duplicate-name-creator', displayName: 'Duplicate Name Creator' })
  const firstParticipant = await registerUser({ email: 'duplicate-name-one@example.com', slug: 'duplicate-name-one', displayName: 'Same Display Name' })
  const secondParticipant = await registerUser({ email: 'duplicate-name-two@example.com', slug: 'duplicate-name-two', displayName: 'Same Display Name' })

  const response = await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${creator.token}`)
    .send(
      createPayload({
        participantSlugs: [firstParticipant.user.slug, secondParticipant.user.slug],
      }),
    )
    .expect(409)

  assert.equal(response.body.code, 'CONFLICT')
  assert.equal(response.body.fields.participants, 'duplicate_display_name')
})

test('POST /api/trattos creates community Tratto only for approved members', async () => {
  const owner = await registerUser({ email: 'community-owner@example.com', slug: 'community-owner', displayName: 'Community Owner' })
  const member = await registerUser({ email: 'community-member@example.com', slug: 'community-member', displayName: 'Community Member' })
  const outsider = await registerUser({ email: 'community-outsider@example.com', slug: 'community-outsider', displayName: 'Community Outsider' })
  const participant = await registerUser({ email: 'community-participant@example.com', slug: 'community-participant', displayName: 'Community Participant' })
  await insertCommunity({ id: 'com-create-private', slug: 'create-private', creatorId: owner.user.id, privacy: 'private' })
  await insertMembership({ id: 'mem-create-owner', communityId: 'com-create-private', userId: owner.user.id, role: 'creator' })
  await insertMembership({ id: 'mem-create-member', communityId: 'com-create-private', userId: member.user.id })

  await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${outsider.token}`)
    .send(createPayload({ participantSlugs: [participant.user.slug], communitySlug: 'create-private' }))
    .expect(403)

  const response = await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${member.token}`)
    .send(createPayload({ participantSlugs: [participant.user.slug], communitySlug: 'create-private' }))
    .expect(201)

  assert.equal(response.body.tratto.community.slug, 'create-private')
})

test('POST /api/trattos validates community user and slug errors', async () => {
  const creator = await registerUser({ email: 'invalid-creator@example.com', slug: 'invalid-creator', displayName: 'Invalid Creator' })
  const participant = await registerUser({ email: 'invalid-participant@example.com', slug: 'invalid-participant', displayName: 'Invalid Participant' })

  await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${creator.token}`)
    .send(createPayload({ participantSlugs: ['missing-user'] }))
    .expect(404)

  await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${creator.token}`)
    .send(createPayload({ participantSlugs: [participant.user.slug], communitySlug: 'missing-community' }))
    .expect(404)

  await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${creator.token}`)
    .send(createPayload({ participantSlugs: [participant.user.slug], communitySlug: 'bad slug' }))
    .expect(400)

  await request(app)
    .post('/api/trattos')
    .set('Authorization', `Bearer ${creator.token}`)
    .send(createPayload({ participantSlugs: [creator.user.slug] }))
    .expect(409)
})

function ids(response) {
  return response.body.trattos.map((tratto) => tratto.id).sort()
}

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

function createPayload(overrides = {}) {
  return {
    title: 'Novo Tratto',
    description: 'Criado pelo teste.',
    category: 'Teste',
    consequence: 'Test consequence.',
    rules: ['Primeira regra.', 'Segunda regra.'],
    deadline: '2026-06-30',
    decisionMethod: 'vote',
    participantSlugs: overrides.participantSlugs,
    judgeSlug: overrides.judgeSlug ?? null,
    communitySlug: overrides.communitySlug ?? null,
  }
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
    overrides.title,
    overrides.description ?? 'Description',
    overrides.category ?? 'Teste',
    overrides.consequence ?? 'Consequence',
    overrides.rules ?? '1. Primeira regra.\n2. Segunda regra.',
    overrides.rulesJson ?? '[{"id":"rule-1","text":"Primeira regra.","position":1},{"id":"rule-2","text":"Segunda regra.","position":2}]',
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
    overrides.invitedByUserId ?? overrides.user.id,
    overrides.invitedAt ?? '2026-06-01T12:00:00.000Z',
  )
}

async function insertCommunity(overrides) {
  db.prepare(
    `INSERT INTO communities (
      id,
      name,
      slug,
      description,
      privacy,
      creator_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    overrides.id,
    overrides.name ?? 'Test Community',
    overrides.slug,
    overrides.description ?? null,
    overrides.privacy ?? 'private',
    overrides.creatorId,
    overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
    overrides.updatedAt ?? '2026-06-01T12:00:00.000Z',
  )
}

async function insertMembership(overrides) {
  db.prepare(
    `INSERT INTO community_memberships (
      id,
      community_id,
      user_id,
      role,
      status,
      requested_at,
      decided_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    overrides.id,
    overrides.communityId,
    overrides.userId,
    overrides.role ?? 'member',
    overrides.status ?? 'member',
    overrides.requestedAt ?? '2026-06-01T12:00:00.000Z',
    overrides.decidedAt ?? '2026-06-01T12:00:00.000Z',
    overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
    overrides.updatedAt ?? '2026-06-01T12:00:00.000Z',
  )
}
