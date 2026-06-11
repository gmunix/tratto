import { Router } from 'express'

import { authRoutes } from './authRoutes.js'
import { communityRoutes } from './communityRoutes.js'
import { healthRoutes } from './healthRoutes.js'

export const routes = Router()

routes.use('/auth', authRoutes)
routes.use('/communities', communityRoutes)
routes.use('/health', healthRoutes)
