import {
  createCommunityWithCreatorMembership,
  findCommunityBySlugForUser,
  listMembersForCommunity,
  listUserCommunities,
  listVisibleCommunitiesForUser,
} from '../models/communityRepository.js'
import { conflictError, httpError, validationError } from '../utils/httpErrors.js'
import { toCommunityDto } from '../utils/communityDto.js'

export function listCommunities(request, response, next) {
  try {
    const query = normalizeString(request.query.query)
    const myCommunities = listUserCommunities(request.user.id).map(toCommunityDto)
    const communities = listVisibleCommunitiesForUser(request.user.id, query).map(toCommunityDto)

    return response.status(200).json({ myCommunities, communities })
  } catch (error) {
    return next(error)
  }
}

export function createCommunity(request, response, next) {
  try {
    const input = validateCommunityInput(request.body)
    const community = createCommunityHandlingConflicts(input, request.user.id)

    return response.status(201).json({ community: toCommunityDto(community) })
  } catch (error) {
    return next(error)
  }
}

export function getCommunity(request, response, next) {
  try {
    const slug = normalizeString(request.params.slug).toLowerCase()
    const community = findCommunityBySlugForUser(slug, request.user.id)

    if (!community || !canViewCommunity(community)) {
      throw httpError(404, 'Community not found', 'NOT_FOUND')
    }

    const members = listMembersForCommunity(community.id)

    return response.status(200).json({
      community: toCommunityDto(community),
      members,
      trattos: [],
      pendingRequests: [],
    })
  } catch (error) {
    return next(error)
  }
}

function validateCommunityInput(body) {
  const fields = {}
  const name = normalizeString(body?.name)
  const slug = normalizeString(body?.slug).toLowerCase()
  const description = normalizeString(body?.description)
  const privacy = normalizeString(body?.privacy) || 'public'

  if (!name) {
    fields.name = 'required'
  }

  if (!/^[a-z0-9-]{3,64}$/.test(slug)) {
    fields.slug = 'invalid'
  }

  if (!['public', 'private'].includes(privacy)) {
    fields.privacy = 'invalid'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid community data', fields)
  }

  return { name, slug, description, privacy }
}

function createCommunityHandlingConflicts(input, creatorId) {
  try {
    return createCommunityWithCreatorMembership(input, creatorId)
  } catch (error) {
    if (isUniqueConstraintError(error, 'slug')) {
      throw conflictError('Community slug already in use', { slug: 'already_in_use' })
    }

    throw error
  }
}

function canViewCommunity(community) {
  if (community.privacy === 'public') {
    return true
  }

  return ['pending', 'member'].includes(community.currentUserMembership?.status)
}

function isUniqueConstraintError(error, field) {
  return (
    error?.code === 'SQLITE_CONSTRAINT_UNIQUE' &&
    error.message.includes(`communities.${field}`)
  ) || error?.message?.includes(`UNIQUE constraint failed: communities.${field}`)
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}
