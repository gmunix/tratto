import {
  findUserBySlug,
  updateUserProfile,
  updateUserTheme,
} from '../models/userRepository.js'
import { conflictError, validationError } from '../utils/httpErrors.js'
import { toUserDto } from '../utils/userDto.js'

const themes = ['grime', 'cassete']

export function updateMe(request, response, next) {
  try {
    const input = validateProfile(request.body, request.user)
    const existingUser = findUserBySlug(input.slug)

    if (existingUser && existingUser.id !== request.user.id) {
      throw conflictError('Slug already in use', { slug: 'already_in_use' })
    }

    const user = updateUserProfileHandlingConflicts(request.user.id, input)

    return response.status(200).json({ user: toUserDto(user) })
  } catch (error) {
    return next(error)
  }
}

export function updateTheme(request, response, next) {
  try {
    const theme = validateTheme(request.body)
    const user = updateUserTheme(request.user.id, theme)

    return response.status(200).json({ user: toUserDto(user) })
  } catch (error) {
    return next(error)
  }
}

function validateProfile(body, user) {
  const fields = {}
  const displayName = hasOwn(body, 'displayName')
    ? normalizeString(body.displayName)
    : user.displayName
  const slug = hasOwn(body, 'slug') ? normalizeString(body.slug).toLowerCase() : user.slug
  const avatarUrl = hasOwn(body, 'avatarUrl') ? normalizeNullableString(body.avatarUrl) : user.avatarUrl

  if (!hasAnyOwn(body, ['displayName', 'slug', 'avatarUrl'])) {
    fields.profile = 'required'
  }

  if (!displayName) {
    fields.displayName = 'required'
  }

  if (!/^[a-z0-9-]{3,32}$/.test(slug)) {
    fields.slug = 'invalid'
  }

  if (avatarUrl && !isHttpUrl(avatarUrl)) {
    fields.avatarUrl = 'invalid'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid profile data', fields)
  }

  return { displayName, slug, avatarUrl }
}

function validateTheme(body) {
  const theme = normalizeString(body?.theme)

  if (!themes.includes(theme)) {
    throw validationError('Invalid theme data', { theme: 'invalid' })
  }

  return theme
}

function updateUserProfileHandlingConflicts(userId, input) {
  try {
    return updateUserProfile(userId, input)
  } catch (error) {
    if (isUniqueConstraintError(error, 'slug')) {
      throw conflictError('Slug already in use', { slug: 'already_in_use' })
    }

    throw error
  }
}

function isUniqueConstraintError(error, field) {
  return (
    error?.code === 'SQLITE_CONSTRAINT_UNIQUE' &&
    error.message.includes(`users.${field}`)
  ) || error?.message?.includes(`UNIQUE constraint failed: users.${field}`)
}

function hasAnyOwn(value, fields) {
  return fields.some((field) => hasOwn(value, field))
}

function hasOwn(value, field) {
  return Object.prototype.hasOwnProperty.call(value ?? {}, field)
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableString(value) {
  if (value === null) {
    return null
  }

  return normalizeString(value)
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}
