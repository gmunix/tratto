import { Button } from '@components/common/Button'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { mockNotifications } from '@/data/mockTrattos'

const notificationTypeLabels = {
  invite: 'Convite',
  mention: 'Menção',
  evidence: 'Evidência',
  verdict: 'Veredito',
  'community-request': 'Comunidade',
  system: 'Sistema',
}

export function Notifications() {
  return (
    <AppLayout title="Notificações">
      <PageContainer className="stack stack--large">
        <Panel
          subtitle="Tudo que exige atenção, constrangimento ou resposta protocolar. Ordenado do mais recente para o menos urgente."
          title="Central de ocorrências"
          titleAs="h1"
        >
          <div className="notification-list">
            {mockNotifications.map((notification) => (
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
