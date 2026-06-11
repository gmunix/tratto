export function toCommunityDto(community) {
  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    privacy: community.privacy,
    creatorId: community.creatorId,
    memberCount: community.memberCount,
    activeTrattoCount: community.activeTrattoCount,
    currentUserMembership: community.currentUserMembership,
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
  }
}

export function toCommunityMembershipDto(membership) {
  if (!membership) {
    return null
  }

  return {
    id: membership.id,
    communityId: membership.communityId,
    userId: membership.userId,
    role: membership.role,
    status: membership.status,
    requestedAt: membership.requestedAt,
    decidedAt: membership.decidedAt,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  }
}
