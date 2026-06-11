import { Router } from 'express'

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const notificationRoutes = Router()

notificationRoutes.use(requireAuth)
notificationRoutes.get('/', listNotifications)
notificationRoutes.patch('/read-all', markAllNotificationsRead)
notificationRoutes.patch('/:id/read', markNotificationRead)
