import assert from 'node:assert/strict'
import test from 'node:test'

import request from 'supertest'

import { createTestDatabase, runBackendScript } from './helpers/testDatabase.js'

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

test('notification and evidence routes require authentication', async () => {
  await request(app).get('/api/notifications').expect(401)
  await request(app).patch('/api/notifications/ntf-auth/read').expect(401)
  await request(app).patch('/api/notifications/read-all').expect(401)
  await request(app).post('/api/trattos/trt-auth/evidences').send({}).expect(401)
})

test('notifications list only current user items and mark read/read-all', async () => {
  const owner = await registerUser({ email: 'notifications-owner@example.com', slug: 'notifications-owner', displayName: 'Notifications Owner' })
  const other = await registerUser({ email: 'notifications-other@example.com', slug: 'notifications-other', displayName: 'Notifications Other' })
  insertNotification({ id: 'ntf-owner-one', userId: owner.user.id, title: 'Owner one' })
  insertNotification({ id: 'ntf-owner-two', userId: owner.user.id, title: 'Owner two' })
  insertNotification({ id: 'ntf-other-one', userId: other.user.id, title: 'Other one' })

  const listResponse = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.deepEqual(notificationIds(listResponse), ['ntf-owner-one', 'ntf-owner-two'])
  assert.equal(listResponse.body.unreadCount, 2)

  await request(app)
    .patch('/api/notifications/ntf-other-one/read')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(404)

  const readResponse = await request(app)
    .patch('/api/notifications/ntf-owner-one/read')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.ok(readResponse.body.notification.readAt)

  const readAllResponse = await request(app)
    .patch('/api/notifications/read-all')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.equal(readAllResponse.body.updatedCount, 1)

  const unreadResponse = await request(app)
    .get('/api/notifications?status=unread')
    .set('Authorization', `Bearer ${owner.token}`)
    .expect(200)

  assert.deepEqual(unreadResponse.body.notifications, [])
  assert.equal(unreadResponse.body.unreadCount, 0)
})

test('participant and creator can add evidence and evidence appears in Tratto detail', async () => {
  const creator = await registerUser({ email: 'evidence-creator@example.com', slug: 'evidence-creator', displayName: 'Evidence Creator' })
  const participant = await registerUser({ email: 'evidence-participant@example.com', slug: 'evidence-participant', displayName: 'Evidence Participant' })
  await insertTratto({ id: 'trt-evidence-success', creatorId: creator.user.id, title: 'Evidence Success', status: 'active' })
  await insertParticipant({ id: 'trt-evidence-success-creator', trattoId: 'trt-evidence-success', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-evidence-success-participant', trattoId: 'trt-evidence-success', user: participant.user })

  const participantResponse = await request(app)
    .post('/api/trattos/trt-evidence-success/evidences')
    .set('Authorization', `Bearer ${participant.token}`)
    .send({ type: 'text', content: 'Prova textual.', metadata: { source: 'test' } })
    .expect(201)

  assert.equal(participantResponse.body.evidence.author.id, participant.user.id)
  assert.deepEqual(participantResponse.body.evidence.metadata, { source: 'test' })

  await request(app)
    .post('/api/trattos/trt-evidence-success/evidences')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ type: 'link', content: 'https://example.com/prova' })
    .expect(201)

  const detailResponse = await request(app)
    .get('/api/trattos/trt-evidence-success')
    .set('Authorization', `Bearer ${creator.token}`)
    .expect(200)

  assert.equal(detailResponse.body.tratto.evidence.length, 2)
  assert.deepEqual(
    detailResponse.body.tratto.evidence.map((evidence) => evidence.type).sort(),
    ['link', 'text'],
  )
})

test('evidence rejects unrelated user, closed/cancelled Trattos, and invalid payloads', async () => {
  const creator = await registerUser({ email: 'reject-creator@example.com', slug: 'reject-creator', displayName: 'Reject Creator' })
  const participant = await registerUser({ email: 'reject-participant@example.com', slug: 'reject-participant', displayName: 'Reject Participant' })
  const outsider = await registerUser({ email: 'reject-outsider@example.com', slug: 'reject-outsider', displayName: 'Reject Outsider' })
  await insertTratto({ id: 'trt-evidence-reject-active', creatorId: creator.user.id, title: 'Reject Active', status: 'active' })
  await insertParticipant({ id: 'trt-evidence-reject-active-creator', trattoId: 'trt-evidence-reject-active', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-evidence-reject-active-participant', trattoId: 'trt-evidence-reject-active', user: participant.user })
  await insertTratto({ id: 'trt-evidence-reject-finished', creatorId: creator.user.id, title: 'Reject Finished', status: 'finished' })
  await insertParticipant({ id: 'trt-evidence-reject-finished-creator', trattoId: 'trt-evidence-reject-finished', user: creator.user, role: 'creator' })
  await insertTratto({ id: 'trt-evidence-reject-cancelled', creatorId: creator.user.id, title: 'Reject Cancelled', status: 'cancelled' })
  await insertParticipant({ id: 'trt-evidence-reject-cancelled-creator', trattoId: 'trt-evidence-reject-cancelled', user: creator.user, role: 'creator' })

  await request(app)
    .post('/api/trattos/trt-evidence-reject-active/evidences')
    .set('Authorization', `Bearer ${outsider.token}`)
    .send({ type: 'text', content: 'Tentativa externa.' })
    .expect(403)

  await request(app)
    .post('/api/trattos/trt-evidence-reject-finished/evidences')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ type: 'text', content: 'Tarde demais.' })
    .expect(409)

  await request(app)
    .post('/api/trattos/trt-evidence-reject-cancelled/evidences')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ type: 'text', content: 'Cancelado.' })
    .expect(409)

  const invalidResponse = await request(app)
    .post('/api/trattos/trt-evidence-reject-active/evidences')
    .set('Authorization', `Bearer ${participant.token}`)
    .send({ type: 'audio', content: '', metadata: [] })
    .expect(400)

  assert.deepEqual(invalidResponse.body.fields, {
    type: 'invalid',
    content: 'required',
    metadata: 'invalid',
  })
})

test('adding evidence creates notifications for other accepted participants', async () => {
  const creator = await registerUser({ email: 'notify-creator@example.com', slug: 'notify-creator', displayName: 'Notify Creator' })
  const participant = await registerUser({ email: 'notify-participant@example.com', slug: 'notify-participant', displayName: 'Notify Participant' })
  const pending = await registerUser({ email: 'notify-pending@example.com', slug: 'notify-pending', displayName: 'Notify Pending' })
  await insertTratto({ id: 'trt-evidence-notify', creatorId: creator.user.id, title: 'Evidence Notify', status: 'review' })
  await insertParticipant({ id: 'trt-evidence-notify-creator', trattoId: 'trt-evidence-notify', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-evidence-notify-participant', trattoId: 'trt-evidence-notify', user: participant.user })
  await insertParticipant({ id: 'trt-evidence-notify-pending', trattoId: 'trt-evidence-notify', user: pending.user, inviteStatus: 'pending', acceptedAt: null })

  await request(app)
    .post('/api/trattos/trt-evidence-notify/evidences')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ type: 'image', content: 'https://example.com/image.png', metadata: { caption: 'Foto' } })
    .expect(201)

  const participantNotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${participant.token}`)
    .expect(200)
  const pendingNotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${pending.token}`)
    .expect(200)
  const creatorNotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${creator.token}`)
    .expect(200)

  assert.equal(participantNotifications.body.notifications.length, 1)
  assert.equal(participantNotifications.body.notifications[0].type, 'evidence')
  assert.equal(participantNotifications.body.notifications[0].targetUrl, '/trattos/trt-evidence-notify')
  assert.deepEqual(pendingNotifications.body.notifications, [])
  assert.deepEqual(creatorNotifications.body.notifications, [])
})

function notificationIds(response) {
  return response.body.notifications.map((notification) => notification.id).sort()
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
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    overrides.id,
    overrides.caseNumber ?? overrides.id.toUpperCase(),
    overrides.title,
    overrides.description ?? 'Description',
    overrides.category ?? 'Teste',
    overrides.consequence ?? 'Consequence',
    overrides.rules ?? '1. Primeira regra.',
    overrides.rulesJson ?? '[{"id":"rule-1","text":"Primeira regra.","position":1}]',
    overrides.status ?? 'active',
    overrides.deadline ?? '2026-06-30',
    overrides.decisionMethod ?? 'vote',
    overrides.creatorId,
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

function insertNotification(overrides) {
  db.prepare(
    `INSERT INTO notifications (
      id,
      user_id,
      type,
      title,
      body,
      target_url,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    overrides.id,
    overrides.userId,
    overrides.type ?? 'system',
    overrides.title,
    overrides.body ?? 'Body',
    overrides.targetUrl ?? '/trattos/test',
    overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
  )
}
