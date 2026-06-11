import { Router } from 'express'

import { authRoutes } from './authRoutes.js'
import { communityRoutes } from './communityRoutes.js'
import { healthRoutes } from './healthRoutes.js'
import { notificationRoutes } from './notificationRoutes.js'
import { trattoRoutes } from './trattoRoutes.js'

export const routes = Router()

routes.use('/auth', authRoutes)
routes.use('/communities', communityRoutes)
routes.use('/health', healthRoutes)
routes.use('/notifications', notificationRoutes)
routes.use('/trattos', trattoRoutes)
