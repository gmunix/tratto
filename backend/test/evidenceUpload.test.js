import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

const uploadDir = mkdtempSync(join(tmpdir(), 'tratto-upload-test-'))
process.env.UPLOAD_DIR = uploadDir
process.env.UPLOAD_MAX_BYTES = String(1024)

const [{ app }, { db }] = await Promise.all([
  import('../src/app.js'),
  import('../src/database/connection.js'),
])

test.after(() => {
  db.close()
  testDatabase.cleanup()
  rmSync(uploadDir, { recursive: true, force: true })
})

test('POST /api/trattos/:id/evidences/upload stores file and creates evidence', async () => {
  const creator = await registerUser({ email: 'upload-creator@example.com', slug: 'upload-creator', displayName: 'Upload Creator' })
  const participant = await registerUser({ email: 'upload-other@example.com', slug: 'upload-other', displayName: 'Upload Other' })

  await insertTratto({ id: 'trt-upload', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-upload-creator', trattoId: 'trt-upload', user: creator.user, role: 'creator' })
  await insertParticipant({ id: 'trt-upload-other', trattoId: 'trt-upload', user: participant.user })

  const response = await request(app)
    .post('/api/trattos/trt-upload/evidences/upload')
    .set('Authorization', `Bearer ${creator.token}`)
    .field('type', 'image')
    .field('caption', 'Foto da prova')
    .attach('file', Buffer.from('fake-png-bytes'), { filename: 'prova.png', contentType: 'image/png' })
    .expect(201)

  assert.equal(response.body.evidence.type, 'image')
  assert.equal(response.body.evidence.content, 'Foto da prova')
  assert.equal(response.body.evidence.metadata.mimeType, 'image/png')
  assert.equal(response.body.evidence.metadata.originalName, 'prova.png')
  assert.ok(response.body.evidence.metadata.fileUrl.startsWith('/uploads/'))

  const storedPath = join(uploadDir, response.body.evidence.metadata.fileUrl.replace('/uploads/', ''))
  assert.ok(existsSync(storedPath), 'uploaded file must be persisted on disk')
})

test('POST /api/trattos/:id/evidences/upload rejects oversized files', async () => {
  const creator = await registerUser({ email: 'upload-size@example.com', slug: 'upload-size', displayName: 'Upload Size' })

  await insertTratto({ id: 'trt-upload-size', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-upload-size-creator', trattoId: 'trt-upload-size', user: creator.user, role: 'creator' })

  const response = await request(app)
    .post('/api/trattos/trt-upload-size/evidences/upload')
    .set('Authorization', `Bearer ${creator.token}`)
    .field('type', 'file')
    .attach('file', Buffer.alloc(2048, 'x'), { filename: 'big.txt', contentType: 'text/plain' })
    .expect(400)

  assert.equal(response.body.code, 'UPLOAD_ERROR')
  assert.equal(response.body.fields.file, 'too_large')
})

test('POST /api/trattos/:id/evidences/upload rejects unsupported mime', async () => {
  const creator = await registerUser({ email: 'upload-mime@example.com', slug: 'upload-mime', displayName: 'Upload Mime' })

  await insertTratto({ id: 'trt-upload-mime', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-upload-mime-creator', trattoId: 'trt-upload-mime', user: creator.user, role: 'creator' })

  const response = await request(app)
    .post('/api/trattos/trt-upload-mime/evidences/upload')
    .set('Authorization', `Bearer ${creator.token}`)
    .field('type', 'image')
    .attach('file', Buffer.from('exe-bytes'), { filename: 'evil.exe', contentType: 'application/octet-stream' })
    .expect(400)

  assert.equal(response.body.fields.file, 'unsupported_type')
})

test('POST /api/trattos/:id/evidences rejects image/file types in JSON route', async () => {
  const creator = await registerUser({ email: 'upload-json@example.com', slug: 'upload-json', displayName: 'Upload Json' })

  await insertTratto({ id: 'trt-upload-json', creatorId: creator.user.id, status: 'active', decisionMethod: 'vote' })
  await insertParticipant({ id: 'trt-upload-json-creator', trattoId: 'trt-upload-json', user: creator.user, role: 'creator' })

  const response = await request(app)
    .post('/api/trattos/trt-upload-json/evidences')
    .set('Authorization', `Bearer ${creator.token}`)
    .send({ type: 'image', content: 'nope' })
    .expect(400)

  assert.equal(response.body.fields.type, 'use_upload_route')
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
    overrides.title ?? 'Upload Test',
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
