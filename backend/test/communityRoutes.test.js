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
