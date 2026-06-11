import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from '../models/notificationRepository.js'
import { httpError, validationError } from '../utils/httpErrors.js'
import { toNotificationDto } from '../utils/notificationDto.js'

export function listNotifications(request, response, next) {
  try {
    const filters = validateFilters(request.query)
    const notifications = listNotificationsForUser(request.user.id, filters).map(toNotificationDto)
    const unreadCount = countUnreadNotificationsForUser(request.user.id)

    return response.status(200).json({ notifications, unreadCount })
  } catch (error) {
    return next(error)
  }
}

export function markNotificationRead(request, response, next) {
  try {
    const notification = markNotificationReadForUser(request.params.id, request.user.id)

    if (!notification) {
      throw httpError(404, 'Notification not found', 'NOT_FOUND')
    }

    return response.status(200).json({ notification: toNotificationDto(notification) })
  } catch (error) {
    return next(error)
  }
}

export function markAllNotificationsRead(request, response, next) {
  try {
    const updatedCount = markAllNotificationsReadForUser(request.user.id)

    return response.status(200).json({ updatedCount })
  } catch (error) {
    return next(error)
  }
}

function validateFilters(query) {
  const status = typeof query.status === 'string' ? query.status.trim() : ''

  if (status && status !== 'unread') {
    throw validationError('Invalid notification filters', { status: 'invalid' })
  }

  return { status }
}
