export function toCommunityDto(community) {
  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    privacy: community.privacy,
    creator: community.creator,
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
    role: membership.role,
    status: membership.status,
  }
}

export function toFullCommunityMembershipDto(membership) {
  if (!membership) {
    return null
  }

  return {
    id: membership.id,
    role: membership.role,
    status: membership.status,
  }
}
