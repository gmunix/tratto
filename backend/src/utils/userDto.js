export function toUserDto(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    slug: user.slug,
    avatarUrl: user.avatarUrl,
    theme: user.theme,
    createdAt: user.createdAt,
  }
}
