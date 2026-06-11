import { Router } from 'express'

import {
  approveCommunityRequest,
  createCommunity,
  denyCommunityRequest,
  getCommunity,
  joinCommunity,
  listCommunities,
} from '../controllers/communityController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

export const communityRoutes = Router()

communityRoutes.use(requireAuth)
communityRoutes.get('/', listCommunities)
communityRoutes.post('/', createCommunity)
communityRoutes.post('/:slug/join', joinCommunity)
communityRoutes.post('/:slug/requests/:requestId/approve', approveCommunityRequest)
communityRoutes.post('/:slug/requests/:requestId/deny', denyCommunityRequest)
communityRoutes.get('/:slug', getCommunity)
