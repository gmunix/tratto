import assert from 'node:assert/strict'
import test from 'node:test'

import request from 'supertest'

import { app } from '../src/app.js'

test('GET /api/health returns service status', async () => {
  const response = await request(app).get('/api/health').expect(200)

  assert.deepEqual(response.body, {
    status: 'ok',
    service: 'tratto-api',
  })
})

test('unknown routes return not found response', async () => {
  const response = await request(app).get('/api/unknown-route').expect(404)

  assert.equal(response.body.message, 'Route GET /api/unknown-route not found')
})
