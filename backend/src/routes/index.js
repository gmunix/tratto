import { Router } from 'express'

import { healthRoutes } from './healthRoutes.js'

export const routes = Router()

routes.use('/health', healthRoutes)
