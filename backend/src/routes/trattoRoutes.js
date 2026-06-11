import { Router } from 'express'

import {
  addComment,
  addEvidence,
  castVote,
  completeTratto,
  createTrattoRoute,
  createVerdictRoute,
  getTratto,
  listTrattos,
  requestJudgment,
} from '../controllers/trattoController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const trattoRoutes = Router()

trattoRoutes.use(requireAuth)
trattoRoutes.get('/', listTrattos)
trattoRoutes.post('/', createTrattoRoute)
trattoRoutes.post('/:id/evidences', addEvidence)
trattoRoutes.post('/:id/comments', addComment)
trattoRoutes.post('/:id/request-judgment', requestJudgment)
trattoRoutes.post('/:id/votes', castVote)
trattoRoutes.post('/:id/verdict', createVerdictRoute)
trattoRoutes.post('/:id/complete', completeTratto)
trattoRoutes.get('/:id', getTratto)
