import { useCallback, useEffect, useState } from 'react'

import { AsyncContent } from '@components/common/AsyncContent'
import { describeApiError } from '@utils/describeApiError'
import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/backend'

const notificationTypeLabels = {
  invite: 'Convite',
  mention: 'Menção',
  evidence: 'Evidência',
  verdict: 'Veredito',
  'community-request': 'Comunidade',
  community_request: 'Comunidade',
  system: 'Sistema',
}

export function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data.notifications)
      setError('')
      window.dispatchEvent(new Event('tratto-notifications-changed'))
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível carregar as notificações.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshNotifications()
  }, [refreshNotifications])

  function retryLoad() {
    setLoading(true)
    setError('')
    refreshNotifications()
  }

  async function markAsRead(notificationId) {
    try {
      await markNotificationRead(notificationId)
      await refreshNotifications()
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível marcar como lida.'))
    }
  }

  async function markAllAsRead() {
    try {
      await markAllNotificationsRead()
      await refreshNotifications()
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível atualizar as notificações.'))
    }
  }

  return (
    <AppLayout title="Notificações">
      <PageContainer className="stack stack--large">
        <Panel
          actions={
            <Button disabled={!unreadCount || loading} onClick={markAllAsRead} type="button" variant="secondary">
              Marcar todas como lidas
            </Button>
          }
          subtitle="Tudo que exige atenção, constrangimento ou resposta protocolar. Ordenado do mais recente para o menos urgente."
          title="Central de ocorrências"
          titleAs="h1"
        >
          <AsyncContent error={error} loading={loading} onRetry={retryLoad}>
            {notifications.length ? (
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
                      {notification.targetUrl ? (
                        <Button to={notification.targetUrl} variant="secondary">
                          Abrir
                        </Button>
                      ) : null}
                      {!notification.readAt ? (
                        <Button onClick={() => markAsRead(notification.id)} type="button" variant="ghost">
                          Marcar como lida
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>Nada pendente por aqui.</EmptyState>
            )}
          </AsyncContent>
        </Panel>
      </PageContainer>
    </AppLayout>
  )
}
