import fs from 'node:fs'

import { db } from '../database/connection.js'
import { allowedImageMimes } from '../middlewares/uploadMiddleware.js'
import { createNotifications } from '../models/notificationRepository.js'
import { findUserBySlug } from '../models/userRepository.js'
import {
  createCommentForTratto,
  createEvidenceForTratto,
  createTratto,
  createVerdictForTratto,
  findTrattoById,
  findVerdictByTrattoId,
  findVisibleTrattoById,
  listVisibleTrattosForUser,
  updateTrattoStatus,
  upsertVote,
  userHasApprovedCommunityMembership,
} from '../models/trattoRepository.js'
import { conflictError, httpError, validationError } from '../utils/httpErrors.js'
import { toCommentDto, toEvidenceDto, toTrattoDetailDto, toTrattoSummaryDto } from '../utils/trattoDto.js'

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
const jsonEvidenceTypes = new Set(['text', 'link'])
const uploadEvidenceTypes = new Set(['image', 'file'])
const voteValues = new Set(['winner', 'abstain'])

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

    const currentParticipant = findParticipantForUser(tratto, request.user.id)
    enforceEvidenceRules(tratto, currentParticipant)

    const result = db.transaction(() => {
      const created = createEvidenceForTratto(tratto.id, input, request.user, currentParticipant, { db })
      const evidenceNotifications = buildEvidenceNotifications(created.tratto, request.user)
      const mentionNotifications = buildMentionNotifications(created.tratto, request.user, input.content, 'evidence')
      createNotifications([...evidenceNotifications, ...mentionNotifications], { db })

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

export function uploadEvidenceRoute(request, response, next) {
  const uploadedPath = request.file?.path ?? null
  let consumed = false

  try {
    if (!request.file) {
      throw validationError('File is required', { file: 'required' })
    }

    const type = normalizeString(request.body?.type)

    if (!uploadEvidenceTypes.has(type)) {
      throw validationError('Invalid evidence type for upload', { type: 'invalid' })
    }

    if (type === 'image' && !allowedImageMimes.has(request.file.mimetype)) {
      throw validationError('Mime type does not match declared evidence type', {
        file: 'unsupported_type',
      })
    }

    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    const currentParticipant = findParticipantForUser(tratto, request.user.id)
    enforceEvidenceRules(tratto, currentParticipant)

    const userCaption = normalizeString(request.body?.caption)
    const caption = userCaption || request.file.originalname
    const metadata = {
      fileUrl: `/uploads/${request.file.filename}`,
      mimeType: request.file.mimetype,
      originalName: request.file.originalname,
      sizeBytes: request.file.size,
    }

    const result = db.transaction(() => {
      const created = createEvidenceForTratto(
        tratto.id,
        { type, content: caption, metadata },
        request.user,
        currentParticipant,
        { db },
      )
      const evidenceNotifications = buildEvidenceNotifications(created.tratto, request.user)
      const mentionNotifications = userCaption
        ? buildMentionNotifications(created.tratto, request.user, caption, 'evidence')
        : []
      createNotifications([...evidenceNotifications, ...mentionNotifications], { db })

      return created
    })()

    consumed = true
    return response.status(201).json({
      evidence: toEvidenceDto(result.evidence),
      tratto: toTrattoDetailDto(result.tratto, request.user.id),
    })
  } catch (error) {
    return next(error)
  } finally {
    if (!consumed && uploadedPath) {
      try {
        fs.unlinkSync(uploadedPath)
      } catch {
        // best-effort cleanup; missing file is acceptable
      }
    }
  }
}

export function addComment(request, response, next) {
  try {
    const input = validateCommentInput(request.body)
    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    const currentParticipant = findParticipantForUser(tratto, request.user.id)
    enforceCommentRules(tratto, currentParticipant)

    const result = db.transaction(() => {
      const created = createCommentForTratto(tratto.id, input, request.user, currentParticipant, { db })
      const commentNotifications = buildCommentNotifications(created.tratto, request.user)
      const mentionNotifications = buildMentionNotifications(created.tratto, request.user, input.content, 'mention')
      createNotifications([...commentNotifications, ...mentionNotifications], { db })

      return created
    })()

    return response.status(201).json({
      comment: toCommentDto(result.comment),
      tratto: toTrattoDetailDto(result.tratto, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

export function requestJudgment(request, response, next) {
  try {
    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    const currentParticipant = findParticipantForUser(tratto, request.user.id)
    const isCreator = tratto.creator?.id === request.user.id
    const isAcceptedJudge =
      currentParticipant?.role === 'judge' && currentParticipant.inviteStatus === 'accepted'

    if (!isCreator && !isAcceptedJudge) {
      throw httpError(403, 'Only creator or assigned judge can request judgment', 'FORBIDDEN', {
        actor: 'not_allowed',
      })
    }

    if (tratto.status !== 'active') {
      throw conflictError('Judgment can only be requested for active Trattos', {
        status: 'invalid_state',
      })
    }

    const result = db.transaction(() => {
      updateTrattoStatus(tratto.id, 'review', { db })
      const refreshed = findVisibleTrattoById(tratto.id, request.user.id, { db })
      const notifications = buildJudgmentNotifications(refreshed, request.user, request.body?.reason)
      createNotifications(notifications, { db })
      return refreshed
    })()

    return response.status(200).json({
      tratto: toTrattoDetailDto(result, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

export function castVote(request, response, next) {
  try {
    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    const currentParticipant = findParticipantForUser(tratto, request.user.id)

    if (
      !currentParticipant ||
      currentParticipant.inviteStatus !== 'accepted' ||
      !['creator', 'participant'].includes(currentParticipant.role)
    ) {
      throw httpError(403, 'Only accepted participants can vote', 'FORBIDDEN', {
        participant: 'required',
      })
    }

    if (tratto.decisionMethod !== 'vote') {
      throw conflictError('Voting is only allowed for vote-based Trattos', {
        decisionMethod: 'invalid',
      })
    }

    if (!['active', 'review'].includes(tratto.status)) {
      throw conflictError('Voting is only allowed for active or review Trattos', {
        status: 'invalid_state',
      })
    }

    const input = validateVoteInput(request.body, tratto)

    const recorded = upsertVote(
      {
        trattoId: tratto.id,
        voterParticipantId: currentParticipant.id,
        votedForParticipantId: input.votedForParticipantId,
        value: input.value,
        reason: input.reason,
      },
      { db },
    )

    return response.status(recorded.replaced ? 200 : 201).json({
      vote: {
        id: recorded.id,
        value: input.value,
        votedForParticipantId: input.votedForParticipantId,
        reason: input.reason,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export function createVerdictRoute(request, response, next) {
  try {
    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    if (findVerdictByTrattoId(tratto.id)) {
      throw conflictError('Verdict already exists for this Tratto', {
        verdict: 'already_exists',
      })
    }

    if (tratto.status !== 'review') {
      throw conflictError('Verdict can only be created for Trattos under review', {
        status: 'invalid_state',
      })
    }

    const currentParticipant = findParticipantForUser(tratto, request.user.id)
    const decidedBy = enforceVerdictPermissions(tratto, request.user, currentParticipant)
    const input = validateVerdictInput(request.body, tratto)

    const result = db.transaction(() => {
      createVerdictForTratto(
        {
          trattoId: tratto.id,
          decisionMethod: tratto.decisionMethod,
          decidedByParticipantId: decidedBy.id,
          winnerParticipantId: input.winnerParticipantId,
          loserParticipantId: input.loserParticipantId,
          summary: input.summary,
        },
        { db },
      )
      updateTrattoStatus(tratto.id, 'compliance', { db })
      const refreshed = findVisibleTrattoById(tratto.id, request.user.id, { db })
      const notifications = buildVerdictNotifications(refreshed, request.user)
      createNotifications(notifications, { db })
      return refreshed
    })()

    return response.status(201).json({
      tratto: toTrattoDetailDto(result, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

export function completeTratto(request, response, next) {
  try {
    const tratto = findTrattoById(request.params.id)

    if (!tratto) {
      throw httpError(404, 'Tratto not found', 'NOT_FOUND')
    }

    if (tratto.creator?.id !== request.user.id) {
      throw httpError(403, 'Only the creator can complete a Tratto', 'FORBIDDEN', {
        actor: 'not_allowed',
      })
    }

    if (tratto.status !== 'compliance') {
      throw conflictError('Tratto can only be completed from compliance state', {
        status: 'invalid_state',
      })
    }

    const now = new Date().toISOString()
    const refreshed = db.transaction(() => {
      updateTrattoStatus(tratto.id, 'finished', { db, now, resolvedAt: now })
      return findVisibleTrattoById(tratto.id, request.user.id, { db })
    })()

    return response.status(200).json({
      tratto: toTrattoDetailDto(refreshed, request.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

function findParticipantForUser(tratto, userId) {
  return tratto.participants.find((participant) => participant.user?.id === userId) ?? null
}

function validateVoteInput(body, tratto) {
  const fields = {}
  const value = normalizeString(body?.value)
  const votedForParticipantId = normalizeString(body?.votedForParticipantId)
  const reason = normalizeString(body?.reason) || null

  if (!voteValues.has(value)) {
    fields.value = 'invalid'
  }

  if (value === 'winner' && !votedForParticipantId) {
    fields.votedForParticipantId = 'required'
  }

  if (votedForParticipantId) {
    const target = tratto.participants.find((participant) => participant.id === votedForParticipantId)

    if (!target) {
      fields.votedForParticipantId = 'not_found'
    } else if (target.role === 'judge') {
      fields.votedForParticipantId = 'invalid'
    }
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid vote data', fields)
  }

  return {
    value,
    votedForParticipantId: value === 'winner' ? votedForParticipantId : null,
    reason,
  }
}

function validateVerdictInput(body, tratto) {
  const fields = {}
  const winnerParticipantId = normalizeString(body?.winnerParticipantId)
  const loserParticipantId = normalizeString(body?.loserParticipantId)
  const summary = normalizeString(body?.summary) || null

  if (!winnerParticipantId) {
    fields.winnerParticipantId = 'required'
  }

  if (!loserParticipantId) {
    fields.loserParticipantId = 'required'
  }

  if (winnerParticipantId && winnerParticipantId === loserParticipantId) {
    fields.loserParticipantId = 'must_differ_from_winner'
  }

  if (Object.keys(fields).length === 0) {
    for (const [field, id] of [
      ['winnerParticipantId', winnerParticipantId],
      ['loserParticipantId', loserParticipantId],
    ]) {
      const participant = tratto.participants.find((entry) => entry.id === id)

      if (!participant) {
        fields[field] = 'not_found'
      } else if (participant.role === 'judge') {
        fields[field] = 'invalid'
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid verdict data', fields)
  }

  return { winnerParticipantId, loserParticipantId, summary }
}

function enforceVerdictPermissions(tratto, currentUser, currentParticipant) {
  if (tratto.decisionMethod === 'judge') {
    if (
      !currentParticipant ||
      currentParticipant.role !== 'judge' ||
      currentParticipant.inviteStatus !== 'accepted'
    ) {
      throw httpError(403, 'Only the assigned judge can resolve this verdict', 'FORBIDDEN', {
        actor: 'not_allowed',
      })
    }

    return currentParticipant
  }

  if (tratto.creator?.id !== currentUser.id) {
    throw httpError(403, 'Only the creator can resolve this verdict', 'FORBIDDEN', {
      actor: 'not_allowed',
    })
  }

  const creatorParticipant = tratto.participants.find((participant) => participant.role === 'creator')

  if (!creatorParticipant) {
    throw httpError(500, 'Creator participant row missing', 'INTERNAL_ERROR')
  }

  return creatorParticipant
}

function buildJudgmentNotifications(tratto, currentUser, reason) {
  const body = reason
    ? `${currentUser.displayName} pediu julgamento: ${reason}`
    : `${currentUser.displayName} solicitou julgamento em "${tratto.title}".`

  return collectNotificationRecipients(tratto, currentUser).map((userId) => ({
    userId,
    type: 'verdict',
    title: 'Julgamento solicitado',
    body,
    targetUrl: `/trattos/${tratto.id}`,
  }))
}

function buildVerdictNotifications(tratto, currentUser) {
  return collectNotificationRecipients(tratto, currentUser).map((userId) => ({
    userId,
    type: 'verdict',
    title: 'Veredito registrado',
    body: `${currentUser.displayName} registrou um veredito em "${tratto.title}".`,
    targetUrl: `/trattos/${tratto.id}`,
  }))
}

function collectNotificationRecipients(tratto, currentUser) {
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

  return [...recipientIds]
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

  if (!jsonEvidenceTypes.has(type)) {
    fields.type = uploadEvidenceTypes.has(type) ? 'use_upload_route' : 'invalid'
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

function validateCommentInput(body) {
  const fields = {}
  const content = normalizeString(body?.content)

  if (!content) {
    fields.content = 'required'
  } else if (content.length > 2000) {
    fields.content = 'too_long'
  }

  if (Object.keys(fields).length > 0) {
    throw validationError('Invalid comment data', fields)
  }

  return { content }
}

function enforceCommentRules(tratto, currentParticipant) {
  if (!['active', 'review', 'compliance'].includes(tratto.status)) {
    throw conflictError('Comments are only allowed on open Trattos', {
      status: 'invalid_state',
    })
  }

  if (!currentParticipant || currentParticipant.inviteStatus !== 'accepted') {
    throw httpError(403, 'Only accepted participants can comment', 'FORBIDDEN', {
      participant: 'required',
    })
  }
}

function buildCommentNotifications(tratto, currentUser) {
  return collectNotificationRecipients(tratto, currentUser).map((userId) => ({
    userId,
    type: 'evidence',
    title: 'Novo comentário no Tratto',
    body: `${currentUser.displayName} comentou em "${tratto.title}".`,
    targetUrl: `/trattos/${tratto.id}`,
  }))
}

function buildMentionNotifications(tratto, currentUser, content, contextType) {
  const slugs = parseMentionSlugs(content)

  if (slugs.length === 0) {
    return []
  }

  const recipientIds = new Set()

  for (const slug of slugs) {
    const participant = tratto.participants.find(
      (entry) => entry.user?.slug?.toLowerCase() === slug.toLowerCase(),
    )

    if (participant?.user?.id && participant.user.id !== currentUser.id) {
      recipientIds.add(participant.user.id)
    }
  }

  if (recipientIds.size === 0) {
    return []
  }

  const title = contextType === 'evidence' ? 'Você foi mencionado em uma evidência' : 'Você foi mencionado em um comentário'

  return [...recipientIds].map((userId) => ({
    userId,
    type: 'mention',
    title,
    body: `${currentUser.displayName} mencionou você em "${tratto.title}".`,
    targetUrl: `/trattos/${tratto.id}`,
  }))
}

function parseMentionSlugs(content) {
  const matches = content.match(/@([a-z0-9-]{3,64})/gi) ?? []
  const slugs = new Set()

  for (const raw of matches) {
    slugs.add(raw.slice(1).toLowerCase())
  }

  return [...slugs]
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
