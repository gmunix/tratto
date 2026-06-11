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
  uploadEvidenceRoute,
} from '../controllers/trattoController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { evidenceUpload, uploadErrorTranslator } from '../middlewares/uploadMiddleware.js'

export const trattoRoutes = Router()

trattoRoutes.use(requireAuth)
trattoRoutes.get('/', listTrattos)
trattoRoutes.post('/', createTrattoRoute)
trattoRoutes.post('/:id/evidences', addEvidence)
trattoRoutes.post(
  '/:id/evidences/upload',
  evidenceUpload.single('file'),
  uploadErrorTranslator,
  uploadEvidenceRoute,
)
trattoRoutes.post('/:id/comments', addComment)
trattoRoutes.post('/:id/request-judgment', requestJudgment)
trattoRoutes.post('/:id/votes', castVote)
trattoRoutes.post('/:id/verdict', createVerdictRoute)
trattoRoutes.post('/:id/complete', completeTratto)
trattoRoutes.get('/:id', getTratto)
