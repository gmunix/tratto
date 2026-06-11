import { Router } from 'express'

import {
  createCommunity,
  getCommunity,
  listCommunities,
} from '../controllers/communityController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const communityRoutes = Router()

communityRoutes.use(requireAuth)
communityRoutes.get('/', listCommunities)
communityRoutes.post('/', createCommunity)
communityRoutes.get('/:slug', getCommunity)
