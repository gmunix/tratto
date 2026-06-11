import { Router } from 'express'

import {
  createTrattoRoute,
  getTratto,
  listTrattos,
} from '../controllers/trattoController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const trattoRoutes = Router()

trattoRoutes.use(requireAuth)
trattoRoutes.get('/', listTrattos)
trattoRoutes.post('/', createTrattoRoute)
trattoRoutes.get('/:id', getTratto)
