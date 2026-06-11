import { searchUsersByQuery } from '../models/userRepository.js'

export function searchUsers(request, response, next) {
  try {
    const query = typeof request.query.query === 'string' ? request.query.query.trim() : ''

    if (query.length < 2) {
      return response.status(200).json({ users: [] })
    }

    const users = searchUsersByQuery(query, { limit: 20 })
    return response.status(200).json({ users })
  } catch (error) {
    return next(error)
  }
}
