export function toTrattoSummaryDto(tratto) {
  return {
    id: tratto.id,
    caseNumber: tratto.caseNumber,
    title: tratto.title,
    description: tratto.description,
    category: tratto.category,
    status: tratto.status,
    consequence: tratto.consequence,
    deadline: tratto.deadline,
    createdAt: tratto.createdAt,
    decisionMethod: tratto.decisionMethod,
    progress: calculateProgress(tratto),
    community: toCommunitySummary(tratto.community),
    participants: tratto.participants.map(toParticipantDto),
    participantNames: tratto.participants.map((participant) => participant.displayName),
  }
}

export function toTrattoDetailDto(tratto, currentUserId) {
  return {
    ...toTrattoSummaryDto(tratto),
    updatedAt: tratto.updatedAt,
    creator: toPublicUserDto(tratto.creator),
    rules: normalizeRules(tratto.rulesJson, tratto.rulesText),
    rulesText: toRulesText(normalizeRules(tratto.rulesJson, tratto.rulesText), tratto.rulesText),
    evidence: tratto.evidence.map(toEvidenceDto),
    comments: tratto.comments.map(toCommentDto),
    verdict: tratto.verdict,
    permissions: buildPermissions(tratto, currentUserId),
  }
}

export function normalizeRules(rulesJson, rulesText) {
  const parsedRules = parseRulesJson(rulesJson)

  if (parsedRules.length > 0) {
    return parsedRules.map((rule, index) => ({
      id: rule.id || `rule-${index + 1}`,
      text: String(rule.text || '').trim(),
      position: Number(rule.position) || index + 1,
    }))
  }

  return String(rulesText || '')
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .filter(Boolean)
    .map((text, index) => ({ id: `rule-${index + 1}`, text, position: index + 1 }))
}

export function rulesToJson(rules) {
  return JSON.stringify(
    rules.map((text, index) => ({
      id: `rule-${index + 1}`,
      text,
      position: index + 1,
    })),
  )
}

export function rulesToText(rules) {
  return rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')
}

function toParticipantDto(participant) {
  return {
    id: participant.id,
    role: participant.role,
    inviteStatus: participant.inviteStatus,
    displayName: participant.displayName,
    user: toPublicUserDto(participant.user),
  }
}

function toEvidenceDto(evidence) {
  return {
    id: evidence.id,
    author: toPublicUserDto(evidence.author),
    authorName: evidence.authorName,
    type: evidence.type,
    content: evidence.content,
    metadata: parseMetadata(evidence.metadataJson),
    createdAt: evidence.createdAt,
  }
}

function toCommentDto(comment) {
  return {
    id: comment.id,
    author: toPublicUserDto(comment.author),
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt,
  }
}

function toCommunitySummary(community) {
  if (!community) {
    return null
  }

  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    privacy: community.privacy,
  }
}

function toPublicUserDto(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    displayName: user.displayName,
    slug: user.slug,
    avatarUrl: user.avatarUrl,
  }
}

function buildPermissions(tratto, currentUserId) {
  const currentParticipant = tratto.participants.find(
    (participant) => participant.user?.id === currentUserId,
  )
  const isCreator = tratto.creator?.id === currentUserId || currentParticipant?.role === 'creator'
  const isAcceptedParticipant = currentParticipant?.inviteStatus === 'accepted'
  const isJudge = currentParticipant?.role === 'judge' && isAcceptedParticipant
  const participantCanAct = isAcceptedParticipant && ['creator', 'participant'].includes(currentParticipant.role)
  const canRequestJudgment = (participantCanAct || isJudge) && tratto.status === 'active'

  return {
    canEdit: isCreator && tratto.status === 'pending',
    canAddEvidence: isAcceptedParticipant && ['active', 'review'].includes(tratto.status),
    canRequestJudgment,
    canVote: participantCanAct && tratto.decisionMethod === 'vote' && ['active', 'review'].includes(tratto.status),
    canResolveVerdict: isJudge && tratto.decisionMethod === 'judge' && tratto.status === 'review',
    canComplete: isCreator && tratto.status === 'compliance',
  }
}

function calculateProgress(tratto) {
  const statusProgress = {
    pending: 10,
    active: 42,
    review: 75,
    compliance: 90,
    'loser-detected': 90,
    finished: 100,
    cancelled: 0,
  }

  return statusProgress[tratto.status] ?? 0
}

function toRulesText(rules, fallbackText) {
  if (rules.length === 0) {
    return fallbackText || ''
  }

  return rules.map((rule, index) => `${index + 1}. ${rule.text}`).join('\n')
}

function parseRulesJson(rulesJson) {
  try {
    const parsed = JSON.parse(rulesJson || '[]')
    return Array.isArray(parsed) ? parsed.filter((rule) => rule?.text) : []
  } catch {
    return []
  }
}

function parseMetadata(metadataJson) {
  if (!metadataJson) {
    return null
  }

  try {
    return JSON.parse(metadataJson)
  } catch {
    return null
  }
}
