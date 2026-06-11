import { mockNotifications } from '@/data/mockTrattos'

const readNotificationsKey = 'tratto-read-notifications'
const notificationStateEvent = 'tratto:notification-state-change'

function getReadNotificationIds() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(readNotificationsKey) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveReadNotificationIds(readIds) {
  window.localStorage.setItem(readNotificationsKey, JSON.stringify([...readIds]))
  window.dispatchEvent(new Event(notificationStateEvent))
}

export function getMockNotifications() {
  const readIds = getReadNotificationIds()

  return mockNotifications.map((notification) =>
    readIds.has(notification.id)
      ? { ...notification, readAt: notification.readAt ?? 'lido agora' }
      : notification,
  )
}

export function getUnreadNotificationCount() {
  return getMockNotifications().filter((notification) => !notification.readAt).length
}

export function markMockNotificationAsRead(notificationId) {
  const readIds = getReadNotificationIds()
  readIds.add(notificationId)
  saveReadNotificationIds(readIds)
}

export function markAllMockNotificationsAsRead() {
  saveReadNotificationIds(new Set(mockNotifications.map((notification) => notification.id)))
}

export function subscribeToMockNotificationState(callback) {
  window.addEventListener(notificationStateEvent, callback)
  window.addEventListener('storage', callback)

  return () => {
    window.removeEventListener(notificationStateEvent, callback)
    window.removeEventListener('storage', callback)
  }
}
