import { Router } from 'express'

import { updateMe, updateTheme } from '../controllers/meController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const meRoutes = Router()

meRoutes.use(requireAuth)
meRoutes.patch('/', updateMe)
meRoutes.patch('/theme', updateTheme)
