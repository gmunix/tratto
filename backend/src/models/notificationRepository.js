import { randomUUID } from 'node:crypto'

import { db as defaultDb } from '../database/connection.js'

export function listNotificationsForUser(userId, filters = {}, { db = defaultDb } = {}) {
  const where = ['user_id = @userId', 'archived_at IS NULL']

  if (filters.status === 'unread') {
    where.push('read_at IS NULL')
  }

  return db
    .prepare(
      `SELECT id, type, title, body, target_url, read_at, created_at
      FROM notifications
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC, id DESC`,
    )
    .all({ userId })
}

export function countUnreadNotificationsForUser(userId, { db = defaultDb } = {}) {
  return db
    .prepare(
      `SELECT COUNT(*) AS count
      FROM notifications
      WHERE user_id = ?
        AND read_at IS NULL
        AND archived_at IS NULL`,
    )
    .get(userId).count
}

export function markNotificationReadForUser(
  notificationId,
  userId,
  { db = defaultDb, now = new Date().toISOString() } = {},
) {
  db.prepare(
    `UPDATE notifications
    SET read_at = COALESCE(read_at, @now)
    WHERE id = @notificationId
      AND user_id = @userId
      AND archived_at IS NULL`,
  ).run({ notificationId, userId, now })

  return findNotificationForUser(notificationId, userId, { db })
}

export function markAllNotificationsReadForUser(
  userId,
  { db = defaultDb, now = new Date().toISOString() } = {},
) {
  const result = db
    .prepare(
      `UPDATE notifications
      SET read_at = @now
      WHERE user_id = @userId
        AND read_at IS NULL
        AND archived_at IS NULL`,
    )
    .run({ userId, now })

  return result.changes
}

export function createNotifications(notifications, { db = defaultDb, now = new Date().toISOString() } = {}) {
  if (notifications.length === 0) {
    return []
  }

  const insert = db.prepare(
    `INSERT INTO notifications (
      id,
      user_id,
      type,
      title,
      body,
      target_url,
      read_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  const created = notifications.map((notification) => ({
    id: notification.id ?? randomUUID(),
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? null,
    targetUrl: notification.targetUrl ?? null,
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt ?? now,
  }))

  for (const notification of created) {
    insert.run(
      notification.id,
      notification.userId,
      notification.type,
      notification.title,
      notification.body,
      notification.targetUrl,
      notification.readAt,
      notification.createdAt,
    )
  }

  return created
}

function findNotificationForUser(notificationId, userId, { db }) {
  return db
    .prepare(
      `SELECT id, type, title, body, target_url, read_at, created_at
      FROM notifications
      WHERE id = ?
        AND user_id = ?
        AND archived_at IS NULL`,
    )
    .get(notificationId, userId)
}
