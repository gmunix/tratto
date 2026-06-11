import { useEffect, useState } from 'react'

import { Button } from '@components/common/Button'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import {
  getMockNotifications,
  markAllMockNotificationsAsRead,
  markMockNotificationAsRead,
  subscribeToMockNotificationState,
} from '@/data/mockNotificationState'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/backend'
import { getSession } from '@/services/session'

const notificationTypeLabels = {
  invite: 'Convite',
  mention: 'Menção',
  evidence: 'Evidência',
  verdict: 'Veredito',
  'community-request': 'Comunidade',
  system: 'Sistema',
}

export function Notifications() {
  const [notifications, setNotifications] = useState(getMockNotifications)
  const [source, setSource] = useState('mock')
  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  useEffect(() => {
    if (getSession().token) {
      refreshNotifications()
    }

    return subscribeToMockNotificationState(() => {
      if (!getSession().token) {
        setNotifications(getMockNotifications())
      }
    })
  }, [])

  async function refreshNotifications() {
    try {
      const data = await getNotifications()
      setNotifications(data.notifications)
      setSource('api')
      window.dispatchEvent(new Event('tratto-notifications-changed'))
    } catch {
      setNotifications(getMockNotifications())
      setSource('mock')
    }
  }

  async function markAsRead(notificationId) {
    if (source === 'api') {
      await markNotificationRead(notificationId)
      await refreshNotifications()
      return
    }

    markMockNotificationAsRead(notificationId)
  }

  async function markAllAsRead() {
    if (source === 'api') {
      await markAllNotificationsRead()
      await refreshNotifications()
      return
    }

    markAllMockNotificationsAsRead()
  }

  return (
    <AppLayout title="Notificações">
      <PageContainer className="stack stack--large">
        <Panel
          actions={
            <Button disabled={!unreadCount} onClick={markAllAsRead} type="button" variant="secondary">
              Marcar todas como lidas
            </Button>
          }
          subtitle="Tudo que exige atenção, constrangimento ou resposta protocolar. Ordenado do mais recente para o menos urgente."
          title="Central de ocorrências"
          titleAs="h1"
        >
          <div className="notification-list">
            {notifications.map((notification) => (
              <article className="notification-card" data-unread={!notification.readAt} key={notification.id}>
                <div className="case-card__header">
                  <div className="stack" style={{ gap: 6 }}>
                    <span className="muted-label">
                      {notificationTypeLabels[notification.type] ?? notification.type} / {notification.createdAt}
                    </span>
                    <h2 className="case-card__title">{notification.title}</h2>
                  </div>
                  {!notification.readAt ? <span className="unread-pill">Novo</span> : null}
                </div>
                <p className="case-card__description">{notification.body}</p>
                <div className="button-row button-row--stack-mobile">
                  <Button to={notification.targetUrl} variant="secondary">
                    Abrir
                  </Button>
                  {!notification.readAt ? (
                    <Button onClick={() => markAsRead(notification.id)} type="button" variant="ghost">
                      Marcar como lida
                    </Button>
                  ) : null}
                  {notification.type === 'invite' ? (
                    <>
                      <Button type="button">Aceitar</Button>
                      <Button type="button" variant="ghost">Recusar</Button>
                    </>
                  ) : null}
                  {notification.type === 'community-request' ? (
                    <Button type="button" variant="ghost">Analisar pedido</Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </PageContainer>
    </AppLayout>
  )
}
