import { api } from './api'

export async function getDashboardData() {
  const [trattosResponse, notificationsResponse] = await Promise.all([
    api.get('/trattos'),
    api.get('/notifications'),
  ])

  return {
    ...trattosResponse.data,
    notifications: notificationsResponse.data.notifications,
    unreadCount: notificationsResponse.data.unreadCount,
  }
}

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data
}

export async function markNotificationRead(notificationId) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`)
  return data.notification
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}

export async function getCommunities(query = '') {
  const { data } = await api.get('/communities', { params: query ? { query } : {} })
  return data
}

export async function getCommunity(slug) {
  const { data } = await api.get(`/communities/${slug}`)
  return data
}

export async function joinCommunity(slug) {
  const { data } = await api.post(`/communities/${slug}/join`)
  return data.membership
}

export async function decideCommunityRequest(slug, requestId, decision) {
  const { data } = await api.post(`/communities/${slug}/requests/${requestId}/${decision}`)
  return data.membership
}

export async function getTrattos(params = {}) {
  const { data } = await api.get('/trattos', { params })
  return data
}

export async function getTratto(trattoId) {
  const { data } = await api.get(`/trattos/${trattoId}`)
  return data.tratto
}

export async function createTratto(payload) {
  const { data } = await api.post('/trattos', payload)
  return data.tratto
}

export async function addEvidence(trattoId, payload) {
  const { data } = await api.post(`/trattos/${trattoId}/evidences`, payload)
  return data
}

export async function updateMe(payload) {
  const { data } = await api.patch('/me', payload)
  return data.user
}

export async function updateTheme(theme) {
  const { data } = await api.patch('/me/theme', { theme })
  return data.user
}
