import { Router } from 'express'

import { searchUsers } from '../controllers/userController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const userRoutes = Router()

userRoutes.use(requireAuth)
userRoutes.get('/', searchUsers)
