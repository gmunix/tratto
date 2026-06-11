import { createAuthToken, deleteAuthTokenById } from '../models/authTokenRepository.js'
import { createUser, findUserByEmail, findUserBySlug } from '../models/userRepository.js'
import { hashPassword, verifyPassword } from '../services/passwordService.js'
import { authError, conflictError, validationError } from '../utils/httpErrors.js'
import { toUserDto } from '../utils/userDto.js'

export async function register(request, response, next) {
  try {
    const input = validateRegister(request.body)

    if (findUserByEmail(input.email)) {
      throw conflictError('Email already in use', { email: 'already_in_use' })
    }

    if (findUserBySlug(input.slug)) {
      throw conflictError('Slug already in use', { slug: 'already_in_use' })
    }

    const passwordHash = await hashPassword(input.password)
    const user = createUser({ ...input, passwordHash })
    const { token } = createAuthToken(user.id)

    return response.status(201).json({ token, user: toUserDto(user) })
  } catch (error) {
    return next(error)
  }
}

export async function login(request, response, next) {
  try {
    const input = validateLogin(request.body)
    const user = findUserByEmail(input.email)

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw authError('Invalid email or password')
    }

    const { token } = createAuthToken(user.id)

    return response.status(200).json({ token, user: toUserDto(user) })
  } catch (error) {
    return next(error)
  }
}

export function logout(request, response) {
  deleteAuthTokenById(request.auth.token.id)

  return response.status(200).json({ success: true })
}

export function me(request, response) {
  return response.status(200).json({ user: toUserDto(request.user) })
}

function validateRegister(body) {
  const fields = {}
  const email = normalizeString(body?.email).toLowerCase()
  const password = normalizeString(body?.password)
  const displayName = normalizeString(body?.displayName)
  const slug = normalizeString(body?.slug).toLowerCase()

  if (!isEmail(email)) {
    fields.email = 'invalid'
  }

  if (password.length < 8) {
    fields.password = 'too_short'
  }

  if (!displayName) {
    fields.displayName = 'required'
  }

  if (!/^[a-z0-9-]{3,32}$/.test(slug)) {
    fields.slug = 'invalid'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid registration data', fields)
  }

  return { email, password, displayName, slug }
}

function validateLogin(body) {
  const fields = {}
  const email = normalizeString(body?.email).toLowerCase()
  const password = normalizeString(body?.password)

  if (!isEmail(email)) {
    fields.email = 'invalid'
  }

  if (!password) {
    fields.password = 'required'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid login data', fields)
  }

  return { email, password }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
