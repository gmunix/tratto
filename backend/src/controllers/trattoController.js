import { db } from '../database/connection.js'
import { createNotifications } from '../models/notificationRepository.js'
import { findUserBySlug } from '../models/userRepository.js'
import {
  createEvidenceForTratto,
  createTratto,
  findTrattoById,
  findVisibleTrattoById,
  listVisibleTrattosForUser,
  userHasApprovedCommunityMembership,
} from '../models/trattoRepository.js'
import { conflictError, httpError, validationError } from '../utils/httpErrors.js'
import { toEvidenceDto, toTrattoDetailDto, toTrattoSummaryDto } from '../utils/trattoDto.js'

const statuses = new Set([
  'pending',
  'active',
  'review',
  'finished',
  'cancelled',
  'loser-detected',
  'compliance',
])
const decisionMethods = new Set(['mutual', 'vote', 'judge'])
const evidenceTypes = new Set(['text', 'link', 'image', 'file'])

export function listTrattos(request, response, next) {
  try {
    const filters = validateListFilters(request.query)
    const trattos = listVisibleTrattosForUser(request.user.id, filters)
    const summaries = trattos.map(toTrattoSummaryDto)

    return response.status(200).json({
      trattos: summaries,
      stats: buildStats(summaries),
    })
  } catch (error) {
    return next(error)
  }
}

export function getTratto(request, response, next) {
  try {
    const tratto = findVisibleTrattoById(request.params.id, request.user.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    return response.status(200).json({
      tratto: toTrattoDetailDto(tratto, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

export function createTrattoRoute(request, response, next) {
  try {
    const input = validateCreateInput(request.body)
    const participants = resolveUsers(input.participantSlugs, 'participantSlugs')
    const judge = input.judgeSlug ? resolveUser(input.judgeSlug, 'judgeSlug') : null
    const community = resolveCommunity(input.communitySlug, input.communityId)

    enforceCreateRules({ input, participants, judge, community, currentUser: request.user })

    const tratto = createTratto(
      {
        ...input,
        participants,
        judge,
        community,
      },
      request.user,
    )

    return response.status(201).json({
      tratto: toTrattoDetailDto(tratto, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

export function addEvidence(request, response, next) {
  try {
    const input = validateEvidenceInput(request.body)
    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    const currentParticipant = findEvidenceParticipant(tratto, request.user.id)
    enforceEvidenceRules(tratto, currentParticipant)

    const result = db.transaction(() => {
      const created = createEvidenceForTratto(tratto.id, input, request.user, currentParticipant, { db })
      const notifications = buildEvidenceNotifications(created.tratto, request.user)
      createNotifications(notifications, { db })

      return created
    })()

    return response.status(201).json({
      evidence: toEvidenceDto(result.evidence),
      tratto: toTrattoDetailDto(result.tratto, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

function validateListFilters(query) {
  const fields = {}
  const status = normalizeString(query.status)
  const communitySlug = normalizeString(query.communitySlug).toLowerCase()
  const scope = normalizeString(query.scope)

  if (status && !statuses.has(status)) {
    fields.status = 'invalid'
  }

  if (communitySlug && !isSlug(communitySlug)) {
    fields.communitySlug = 'invalid'
  }

  if (scope && scope !== 'mine') {
    fields.scope = 'invalid'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid Tratto filters', fields)
  }

  return { status, communitySlug, scope }
}

function validateCreateInput(body) {
  const fields = {}
  const title = normalizeString(body?.title)
  const description = normalizeString(body?.description)
  const category = normalizeString(body?.category) || 'Outro'
  const consequence = normalizeString(body?.consequence)
  const deadline = normalizeString(body?.deadline)
  const decisionMethod = normalizeString(body?.decisionMethod) || 'mutual'
  const participantSlugs = normalizeSlugArray(body?.participantSlugs)
  const judgeSlug = normalizeOptionalSlug(body?.judgeSlug, fields, 'judgeSlug')
  const communitySlug = normalizeOptionalSlug(body?.communitySlug, fields, 'communitySlug')
  const communityId = normalizeString(body?.communityId)
  const rules = Array.isArray(body?.rules)
    ? body.rules.map(normalizeString).filter(Boolean)
    : []

  if (!title) {
    fields.title = 'required'
  }

  if (!decisionMethods.has(decisionMethod)) {
    fields.decisionMethod = 'invalid'
  }

  if (decisionMethod === 'judge' && !judgeSlug) {
    fields.judgeSlug = 'required'
  }

  if (!Array.isArray(body?.participantSlugs)) {
    fields.participantSlugs = 'required'
  } else if (participantSlugs.length !== body.participantSlugs.length) {
    fields.participantSlugs = 'invalid'
  }

  if (!Array.isArray(body?.rules)) {
    fields.rules = 'required'
  } else if (rules.length === 0) {
    fields.rules = 'required'
  }

  if (communityId && communitySlug) {
    fields.community = 'ambiguous'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid Tratto data', fields)
  }

  return {
    title,
    description,
    category,
    consequence,
    deadline,
    decisionMethod,
    participantSlugs,
    judgeSlug,
    communitySlug,
    communityId,
    rules,
  }
}

function validateEvidenceInput(body) {
  const fields = {}
  const type = normalizeString(body?.type)
  const content = normalizeString(body?.content)
  const metadata = body?.metadata ?? null

  if (!evidenceTypes.has(type)) {
    fields.type = 'invalid'
  }

  if (!content) {
    fields.content = 'required'
  }

  if (metadata !== null && (!isPlainObject(metadata) || Array.isArray(metadata))) {
    fields.metadata = 'invalid'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid evidence data', fields)
  }

  return { type, content, metadata }
}

function findEvidenceParticipant(tratto, userId) {
  return tratto.participants.find((participant) => participant.user?.id === userId) ?? null
}

function enforceEvidenceRules(tratto, currentParticipant) {
  if (!['active', 'review'].includes(tratto.status)) {
    throw conflictError('Evidence can only be added to active or review Trattos', {
      status: 'invalid_state',
    })
  }

  if (
    !currentParticipant ||
    currentParticipant.inviteStatus !== 'accepted' ||
    !['creator', 'participant'].includes(currentParticipant.role)
  ) {
    throw httpError(403, 'Only accepted participants can add evidence', 'FORBIDDEN', {
      participant: 'required',
    })
  }
}

function buildEvidenceNotifications(tratto, currentUser) {
  const recipientIds = new Set()

  for (const participant of tratto.participants) {
    if (
      participant.user?.id &&
      participant.user.id !== currentUser.id &&
      participant.inviteStatus === 'accepted'
    ) {
      recipientIds.add(participant.user.id)
    }
  }

  return [...recipientIds].map((userId) => ({
    userId,
    type: 'evidence',
    title: 'Nova evidência no Tratto',
    body: `${currentUser.displayName} adicionou uma evidência em "${tratto.title}".`,
    targetUrl: `/trattos/${tratto.id}`,
  }))
}

function resolveUsers(slugs, fieldName) {
  return slugs.map((slug) => resolveUser(slug, fieldName))
}

function resolveUser(slug, fieldName) {
  const user = findUserBySlug(slug)

  if (!user) {
    throw httpError(404, `Unknown user slug: ${slug}`, 'NOT_FOUND', {
      [fieldName]: 'not_found',
    })
  }

  return user
}

function resolveCommunity(communitySlug, communityId) {
  if (!communitySlug && !communityId) {
    return null
  }

  const community = db
    .prepare(
      `SELECT id, name, slug, privacy
      FROM communities
      WHERE ${communitySlug ? 'slug = ?' : 'id = ?'}`,
    )
    .get(communitySlug || communityId)

  if (!community) {
    throw httpError(404, 'Community not found', 'NOT_FOUND', { community: 'not_found' })
  }

  return community
}

function enforceCreateRules({ input, participants, judge, community, currentUser }) {
  const invitedUserIds = new Set(participants.map((participant) => participant.id))

  if (invitedUserIds.has(currentUser.id)) {
    throw conflictError('Creator cannot be invited as a participant', {
      participantSlugs: 'includes_creator',
    })
  }

  if (input.participantSlugs.length !== invitedUserIds.size) {
    throw conflictError('Duplicate participant slugs', { participantSlugs: 'duplicate' })
  }

  const participantDisplayNames = [currentUser, ...participants]

  if (judge) {
    participantDisplayNames.push(judge)
  }

  if (hasDuplicateDisplayNames(participantDisplayNames)) {
    throw conflictError('Tratto participants must have unique display names', {
      participants: 'duplicate_display_name',
    })
  }

  if (judge && (judge.id === currentUser.id || invitedUserIds.has(judge.id))) {
    throw conflictError('Judge must be distinct from creator and participants', {
      judgeSlug: 'duplicate_user',
    })
  }

  if (community && !userHasApprovedCommunityMembership(community.id, currentUser.id)) {
    throw httpError(403, 'Community membership required', 'FORBIDDEN', {
      community: 'membership_required',
    })
  }
}

function buildStats(trattos) {
  const stats = {
    wins: 0,
    losses: 0,
    active: 0,
    pending: 0,
    review: 0,
    finished: 0,
  }

  for (const tratto of trattos) {
    if (Object.hasOwn(stats, tratto.status)) {
      stats[tratto.status] += 1
    }
  }

  return stats
}

function normalizeSlugArray(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values.map((value) => normalizeString(value).toLowerCase()).filter(isSlug)
}

function normalizeOptionalSlug(value, fields, fieldName) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const slug = normalizeString(value).toLowerCase()

  if (!isSlug(slug)) {
    fields[fieldName] = 'invalid'
  }

  return slug
}

function isSlug(value) {
  return /^[a-z0-9-]{3,64}$/.test(value)
}

function hasDuplicateDisplayNames(users) {
  const displayNames = users.map((user) => normalizeString(user.displayName).toLowerCase())
  return new Set(displayNames).size !== displayNames.length
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && value.constructor === Object
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}
