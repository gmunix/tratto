import { Router } from 'express'

import { authRoutes } from './authRoutes.js'
import { healthRoutes } from './healthRoutes.js'

export const routes = Router()

routes.use('/auth', authRoutes)
routes.use('/health', healthRoutes)
