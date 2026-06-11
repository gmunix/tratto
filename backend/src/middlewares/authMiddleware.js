import { findAuthTokenByToken, touchAuthToken } from '../models/authTokenRepository.js'
import { findUserById } from '../models/userRepository.js'
import { authError } from '../utils/httpErrors.js'

export function requireAuth(request, _response, next) {
  const token = getBearerToken(request.headers.authorization)

  if (!token) {
    return next(authError('Missing bearer token'))
  }

  const authToken = findAuthTokenByToken(token)

  if (!authToken || authToken.expiresAt <= new Date().toISOString()) {
    return next(authError('Invalid or expired token'))
  }

  const user = findUserById(authToken.userId)

  if (!user) {
    return next(authError('Invalid or expired token'))
  }

  touchAuthToken(authToken.id)
  request.auth = { token: authToken }
  request.user = user

  return next()
}

function getBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return null
  }

  const [scheme, token, extra] = authorizationHeader.trim().split(/\s+/)

  if (extra || scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}
