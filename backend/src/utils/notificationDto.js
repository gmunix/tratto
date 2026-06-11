export function toNotificationDto(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    targetUrl: notification.target_url ?? notification.targetUrl,
    readAt: notification.read_at ?? notification.readAt,
    createdAt: notification.created_at ?? notification.createdAt,
  }
}
