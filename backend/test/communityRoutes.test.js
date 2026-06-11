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

test('community routes require authentication', async () => {
  await request(app).get('/api/communities').expect(401)
  await request(app)
    .post('/api/communities')
    .send({ name: 'Sem Token', slug: 'sem-token', privacy: 'public' })
    .expect(401)
  await request(app).get('/api/communities/qualquer').expect(401)
  await request(app).post('/api/communities/qualquer/join').expect(401)
  await request(app)
    .post('/api/communities/qualquer/requests/qualquer/approve')
    .expect(401)
  await request(app)
    .post('/api/communities/qualquer/requests/qualquer/deny')
    .expect(401)
})

test('GET /api/communities returns public and user private communities', async () => {
  const { token, user } = await registerUser({
    email: 'member@example.com',
    slug: 'community-member',
  })
  await insertCommunity({
    id: 'com-public-list',
    slug: 'public-list',
    privacy: 'public',
    creatorId: user.id,
  })
  await insertCommunity({
    id: 'com-private-list',
    slug: 'private-list',
    privacy: 'private',
    creatorId: user.id,
  })
  await insertCommunity({
    id: 'com-hidden-list',
    slug: 'hidden-list',
    privacy: 'private',
    creatorId: user.id,
  })
  await insertMembership({
    id: 'mem-private-list',
    communityId: 'com-private-list',
    userId: user.id,
    role: 'member',
    status: 'member',
  })

  const response = await request(app)
    .get('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  const slugs = response.body.communities.map((community) => community.slug)
  const mySlugs = response.body.myCommunities.map((community) => community.slug)
  const privateCommunity = response.body.communities.find(
    (community) => community.slug === 'private-list',
  )

  assert.equal(slugs.includes('public-list'), true)
  assert.equal(slugs.includes('private-list'), true)
  assert.equal(slugs.includes('hidden-list'), false)
  assert.deepEqual(mySlugs, ['private-list'])
  assert.deepEqual(privateCommunity.currentUserMembership, {
    role: 'member',
    status: 'member',
  })
  assert.equal(privateCommunity.memberCount, 1)
  assert.equal(privateCommunity.activeTrattoCount, 0)
  assert.deepEqual(privateCommunity.creator, {
    id: user.id,
    displayName: 'Test User',
    slug: 'community-member',
    avatarUrl: null,
  })
  assert.equal(privateCommunity.creatorId, undefined)
  assert.equal(privateCommunity.currentUserMembership.id, undefined)
  assert.equal(privateCommunity.currentUserMembership.createdAt, undefined)
})

test('GET /api/communities filters visible communities by query', async () => {
  const { token, user } = await registerUser({
    email: 'search@example.com',
    slug: 'search-user',
  })
  await insertCommunity({
    id: 'com-query-public',
    name: 'Republica Aberta',
    slug: 'republica-aberta',
    privacy: 'public',
    creatorId: user.id,
  })
  await insertCommunity({
    id: 'com-query-other',
    name: 'Outro Grupo',
    slug: 'outro-grupo',
    privacy: 'public',
    creatorId: user.id,
  })

  const response = await request(app)
    .get('/api/communities?query=republica')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  assert.deepEqual(
    response.body.communities.map((community) => community.slug),
    ['republica-aberta'],
  )
})

test('POST /api/communities creates community and creator membership', async () => {
  const { token, user } = await registerUser({
    email: 'creator@example.com',
    slug: 'community-creator',
  })

  const response = await request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Nova Comunidade',
      slug: 'nova-comunidade',
      privacy: 'private',
      description: 'Criada no teste.',
    })
    .expect(201)

  const membership = db
    .prepare('SELECT role, status FROM community_memberships WHERE community_id = ? AND user_id = ?')
    .get(response.body.community.id, user.id)

  assert.equal(response.body.community.slug, 'nova-comunidade')
  assert.equal(response.body.community.privacy, 'private')
  assert.deepEqual(response.body.community.creator, {
    id: user.id,
    displayName: 'Test User',
    slug: 'community-creator',
    avatarUrl: null,
  })
  assert.deepEqual(response.body.community.currentUserMembership, {
    role: 'creator',
    status: 'member',
  })
  assert.deepEqual(membership, { role: 'creator', status: 'member' })
})

test('POST /api/communities enforces unique slugs', async () => {
  const { token } = await registerUser({
    email: 'duplicate-community@example.com',
    slug: 'duplicate-community-user',
  })

  await request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Slug Repetido', slug: 'slug-repetido', privacy: 'public' })
    .expect(201)

  const response = await request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Slug Repetido 2', slug: 'SLUG-REPETIDO', privacy: 'public' })
    .expect(409)

  assert.equal(response.body.fields.slug, 'already_in_use')
})

test('GET /api/communities/:slug hides private communities from non-members', async () => {
  const owner = await registerUser({
    email: 'private-owner@example.com',
    slug: 'private-owner',
  })
  const outsider = await registerUser({
    email: 'private-outsider@example.com',
    slug: 'private-outsider',
  })
  await insertCommunity({
    id: 'com-private-detail',
    slug: 'private-detail',
    privacy: 'private',
    creatorId: owner.user.id,
  })
  await insertMembership({
    id: 'mem-private-detail-owner',
    communityId: 'com-private-detail',
    userId: owner.user.id,
    role: 'creator',
    status: 'member',
  })

  await request(app)
    .get('/api/communities/private-detail')
    .set('Authorization', `Bearer ${outsider.token}`)
    .expect(404)

  const response = await request(app)
    .get('/api/communities/private-detail')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.equal(response.body.community.slug, 'private-detail')
  assert.deepEqual(response.body.community.currentUserMembership, {
    role: 'creator',
    status: 'member',
  })
  assert.equal(response.body.members.length, 1)
  assert.deepEqual(response.body.trattos, [])
  assert.deepEqual(response.body.pendingRequests, [])
})

test('private communities reject pending denied and removed memberships', async () => {
  const owner = await registerUser({
    email: 'visibility-owner@example.com',
    slug: 'visibility-owner',
  })
  const user = await registerUser({
    email: 'visibility-user@example.com',
    slug: 'visibility-user',
  })

  for (const status of ['pending', 'denied', 'removed']) {
    await insertCommunity({
      id: `com-private-${status}`,
      slug: `private-${status}`,
      privacy: 'private',
      creatorId: owner.user.id,
    })
    await insertMembership({
      id: `mem-private-${status}`,
      communityId: `com-private-${status}`,
      userId: user.user.id,
      role: 'member',
      status,
    })
  }

  const listResponse = await request(app)
    .get('/api/communities?query=private')
    .set('Authorization', `Bearer ${user.token}`)
    .expect(200)

  const listedSlugs = listResponse.body.communities.map((community) => community.slug)
  const mySlugs = listResponse.body.myCommunities.map((community) => community.slug)

  assert.equal(listedSlugs.includes('private-pending'), false)
  assert.equal(listedSlugs.includes('private-denied'), false)
  assert.equal(listedSlugs.includes('private-removed'), false)
  assert.deepEqual(mySlugs, [])

  for (const status of ['pending', 'denied', 'removed']) {
    await request(app)
      .get(`/api/communities/private-${status}`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(404)
  }
})

test('POST /api/communities/:slug/join joins public communities idempotently', async () => {
  const owner = await registerUser({
    email: 'public-join-owner@example.com',
    slug: 'public-join-owner',
  })
  const user = await registerUser({
    email: 'public-join-user@example.com',
    slug: 'public-join-user',
  })
  await insertCommunity({
    id: 'com-public-join',
    slug: 'public-join',
    privacy: 'public',
    creatorId: owner.user.id,
  })

  const response = await request(app)
    .post('/api/communities/public-join/join')
    .set('Authorization', `Bearer ${user.token}`)
    .expect(200)

  const repeatResponse = await request(app)
    .post('/api/communities/public-join/join')
    .set('Authorization', `Bearer ${user.token}`)
    .expect(200)

  const membership = db
    .prepare('SELECT id, role, status FROM community_memberships WHERE community_id = ? AND user_id = ?')
    .get('com-public-join', user.user.id)

  assert.deepEqual(response.body.membership, {
    id: membership.id,
    role: 'member',
    status: 'member',
  })
  assert.deepEqual(repeatResponse.body.membership, response.body.membership)
  assert.deepEqual(membership, response.body.membership)
})

test('POST /api/communities/:slug/join creates private pending request without detail visibility', async () => {
  const owner = await registerUser({
    email: 'private-join-owner@example.com',
    slug: 'private-join-owner',
  })
  const user = await registerUser({
    email: 'private-join-user@example.com',
    slug: 'private-join-user',
  })
  await insertCommunity({
    id: 'com-private-join',
    slug: 'private-join',
    privacy: 'private',
    creatorId: owner.user.id,
  })
  await insertMembership({
    id: 'mem-private-join-owner',
    communityId: 'com-private-join',
    userId: owner.user.id,
    role: 'creator',
    status: 'member',
  })

  const response = await request(app)
    .post('/api/communities/private-join/join')
    .set('Authorization', `Bearer ${user.token}`)
    .expect(202)

  await request(app)
    .get('/api/communities/private-join')
    .set('Authorization', `Bearer ${user.token}`)
    .expect(404)

  const ownerDetailResponse = await request(app)
    .get('/api/communities/private-join')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.equal(response.body.membership.role, 'member')
  assert.equal(response.body.membership.status, 'pending')
  assert.deepEqual(
    ownerDetailResponse.body.pendingRequests.map((request) => request.id),
    [response.body.membership.id],
  )
})

test('creator and admin can approve or deny pending community requests', async () => {
  const owner = await registerUser({
    email: 'request-owner@example.com',
    slug: 'request-owner',
  })
  const admin = await registerUser({
    email: 'request-admin@example.com',
    slug: 'request-admin',
  })
  const approvedUser = await registerUser({
    email: 'approved-request-user@example.com',
    slug: 'approved-request-user',
  })
  const deniedUser = await registerUser({
    email: 'denied-request-user@example.com',
    slug: 'denied-request-user',
  })
  await insertCommunity({
    id: 'com-request-decisions',
    slug: 'request-decisions',
    privacy: 'private',
    creatorId: owner.user.id,
  })
  await insertMembership({
    id: 'mem-request-owner',
    communityId: 'com-request-decisions',
    userId: owner.user.id,
    role: 'creator',
    status: 'member',
  })
  await insertMembership({
    id: 'mem-request-admin',
    communityId: 'com-request-decisions',
    userId: admin.user.id,
    role: 'admin',
    status: 'member',
  })
  await insertMembership({
    id: 'mem-request-approve',
    communityId: 'com-request-decisions',
    userId: approvedUser.user.id,
    role: 'member',
    status: 'pending',
  })
  await insertMembership({
    id: 'mem-request-deny',
    communityId: 'com-request-decisions',
    userId: deniedUser.user.id,
    role: 'member',
    status: 'pending',
  })

  const approveResponse = await request(app)
    .post('/api/communities/request-decisions/requests/mem-request-approve/approve')
    .set('Authorization', `Bearer ${admin.token}`)
    .expect(200)
  const denyResponse = await request(app)
    .post('/api/communities/request-decisions/requests/mem-request-deny/deny')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.deepEqual(approveResponse.body.membership, {
    id: 'mem-request-approve',
    role: 'member',
    status: 'member',
  })
  assert.deepEqual(denyResponse.body.membership, {
    id: 'mem-request-deny',
    role: 'member',
    status: 'denied',
  })
})

test('non-admin users cannot approve or deny community requests', async () => {
  const owner = await registerUser({
    email: 'non-admin-owner@example.com',
    slug: 'non-admin-owner',
  })
  const member = await registerUser({
    email: 'non-admin-member@example.com',
    slug: 'non-admin-member',
  })
  const applicant = await registerUser({
    email: 'non-admin-applicant@example.com',
    slug: 'non-admin-applicant',
  })
  await insertCommunity({
    id: 'com-non-admin-request',
    slug: 'non-admin-request',
    privacy: 'private',
    creatorId: owner.user.id,
  })
  await insertMembership({
    id: 'mem-non-admin-owner',
    communityId: 'com-non-admin-request',
    userId: owner.user.id,
    role: 'creator',
    status: 'member',
  })
  await insertMembership({
    id: 'mem-non-admin-member',
    communityId: 'com-non-admin-request',
    userId: member.user.id,
    role: 'member',
    status: 'member',
  })
  await insertMembership({
    id: 'mem-non-admin-applicant',
    communityId: 'com-non-admin-request',
    userId: applicant.user.id,
    role: 'member',
    status: 'pending',
  })

  await request(app)
    .post('/api/communities/non-admin-request/requests/mem-non-admin-applicant/approve')
    .set('Authorization', `Bearer ${member.token}`)
    .expect(403)
  await request(app)
    .post('/api/communities/non-admin-request/requests/mem-non-admin-applicant/deny')
    .set('Authorization', `Bearer ${member.token}`)
    .expect(403)
})

test('community requests can only be approved or denied while pending', async () => {
  const owner = await registerUser({
    email: 'not-pending-owner@example.com',
    slug: 'not-pending-owner',
  })
  const user = await registerUser({
    email: 'not-pending-user@example.com',
    slug: 'not-pending-user',
  })
  await insertCommunity({
    id: 'com-not-pending-request',
    slug: 'not-pending-request',
    privacy: 'private',
    creatorId: owner.user.id,
  })
  await insertMembership({
    id: 'mem-not-pending-owner',
    communityId: 'com-not-pending-request',
    userId: owner.user.id,
    role: 'creator',
    status: 'member',
  })
  await insertMembership({
    id: 'mem-not-pending-user',
    communityId: 'com-not-pending-request',
    userId: user.user.id,
    role: 'member',
    status: 'member',
  })

  const response = await request(app)
    .post('/api/communities/not-pending-request/requests/mem-not-pending-user/deny')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(409)

  assert.equal(response.body.fields.status, 'not_pending')
})

test('denied and removed private memberships can request again', async () => {
  const owner = await registerUser({
    email: 'request-again-owner@example.com',
    slug: 'request-again-owner',
  })
  const deniedUser = await registerUser({
    email: 'request-again-denied@example.com',
    slug: 'request-again-denied',
  })
  const removedUser = await registerUser({
    email: 'request-again-removed@example.com',
    slug: 'request-again-removed',
  })
  await insertCommunity({
    id: 'com-request-again',
    slug: 'request-again',
    privacy: 'private',
    creatorId: owner.user.id,
  })
  await insertMembership({
    id: 'mem-request-again-owner',
    communityId: 'com-request-again',
    userId: owner.user.id,
    role: 'creator',
    status: 'member',
  })
  await insertMembership({
    id: 'mem-request-again-denied',
    communityId: 'com-request-again',
    userId: deniedUser.user.id,
    role: 'member',
    status: 'denied',
  })
  await insertMembership({
    id: 'mem-request-again-removed',
    communityId: 'com-request-again',
    userId: removedUser.user.id,
    role: 'member',
    status: 'removed',
  })

  const deniedResponse = await request(app)
    .post('/api/communities/request-again/join')
    .set('Authorization', `Bearer ${deniedUser.token}`)
    .expect(202)
  const removedResponse = await request(app)
    .post('/api/communities/request-again/join')
    .set('Authorization', `Bearer ${removedUser.token}`)
    .expect(202)

  assert.deepEqual(deniedResponse.body.membership, {
    id: 'mem-request-again-denied',
    role: 'member',
    status: 'pending',
  })
  assert.deepEqual(removedResponse.body.membership, {
    id: 'mem-request-again-removed',
    role: 'member',
    status: 'pending',
  })
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
    overrides.privacy,
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
    overrides.role,
    overrides.status,
    overrides.requestedAt ?? '2026-06-01T12:00:00.000Z',
    overrides.decidedAt ?? '2026-06-01T12:00:00.000Z',
    overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
    overrides.updatedAt ?? '2026-06-01T12:00:00.000Z',
  )
}
