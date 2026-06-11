import { Router } from 'express'

import { login, logout, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const authRoutes = Router()

authRoutes.post('/register', register)
authRoutes.post('/login', login)
authRoutes.post('/logout', requireAuth, logout)
authRoutes.get('/me', requireAuth, me)
