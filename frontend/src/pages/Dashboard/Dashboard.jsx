import { useCallback, useEffect, useState } from 'react'

import { AsyncContent } from '@components/common/AsyncContent'
import { describeApiError } from '@utils/describeApiError'
import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { StatCard } from '@components/common/StatCard'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { TrattoCard } from '@components/features/trattos/TrattoCard'
import { getDashboardData } from '@/services/backend'

export function Dashboard() {
  const [trattos, setTrattos] = useState([])
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboardData()
      setTrattos(data.trattos)
      setNotifications(data.notifications)
      setStats(data.stats)
      setError('')
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível carregar o painel.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  function retryLoad() {
    setLoading(true)
    setError('')
    loadDashboard()
  }

  const activeTrattos = trattos.filter((tratto) => tratto.status === 'active')
  const pendingTrattos = trattos.filter((tratto) => tratto.status === 'pending')
  const reviewTrattos = trattos.filter((tratto) => tratto.status === 'review')
  const closedTrattos = trattos.filter((tratto) =>
    ['finished', 'loser-detected', 'cancelled'].includes(tratto.status),
  )
  const notificationsPreview = notifications.slice(0, 3)

  return (
    <AppLayout
      actions={
        <Button to="/novo">
          Novo trato
        </Button>
      }
      title="Painel de controle"
    >
      <PageContainer className="stack stack--large">
        <AsyncContent error={error} loading={loading} onRetry={retryLoad}>
          <section className="stats-grid">
            <StatCard label="Vitórias" tone="success" value={stats?.wins ?? 0} />
            <StatCard label="Derrotas" tone="danger" value={stats?.losses ?? 0} />
            <StatCard label="Ativos" tone="accent" value={activeTrattos.length} />
            <StatCard label="Pendências" tone="warning" value={pendingTrattos.length + reviewTrattos.length} />
          </section>

          <section className="page-grid">
            <div className="stack stack--large">
              <Panel
                subtitle="Aguardando aceitação dos convidados ou seu próprio aceite."
                title="Pendentes"
              >
                {pendingTrattos.length ? (
                  <div className="stack">
                    {pendingTrattos.map((tratto) => (
                      <TrattoCard key={tratto.id} tratto={tratto} />
                    ))}
                  </div>
                ) : (
                  <EmptyState>Nenhum convite aguardando resposta.</EmptyState>
                )}
              </Panel>

              <Panel
                subtitle="Tratos com prazo correndo e potencial real de constrangimento."
                title="Casos ativos"
              >
                {activeTrattos.length ? (
                  <div className="stack">
                    {activeTrattos.map((tratto) => (
                      <TrattoCard key={tratto.id} tratto={tratto} />
                    ))}
                  </div>
                ) : (
                  <EmptyState>Nenhum trato ativo no momento.</EmptyState>
                )}
              </Panel>

              <Panel
                subtitle="Há evidências suficientes para alguém perder a pose."
                title="Em julgamento"
              >
                <div className="stack">
                  {reviewTrattos.length ? (
                    reviewTrattos.map((tratto) => <TrattoCard key={tratto.id} tratto={tratto} />)
                  ) : (
                    <EmptyState>Nenhum processo esperando martelo oficial.</EmptyState>
                  )}
                </div>
              </Panel>

              <Panel subtitle="Material arquivado para constrangimentos futuros." title="Histórico">
                {closedTrattos.length ? (
                  <div className="stack">
                    {closedTrattos.map((tratto) => (
                      <TrattoCard dimmed key={tratto.id} tratto={tratto} />
                    ))}
                  </div>
                ) : (
                  <EmptyState>Nada arquivado ainda.</EmptyState>
                )}
              </Panel>
            </div>

            <aside className="stack stack--large">
              <Panel actions={<Button to="/notificacoes" variant="ghost">Ver todas</Button>} title="Notificações">
                {notificationsPreview.length ? (
                  <div className="stack">
                    {notificationsPreview.map((notification) => (
                      <article className="notification-card" data-unread={!notification.readAt} key={notification.id}>
                        <span className="muted-label">{notification.type}</span>
                        <h3 className="case-card__title">{notification.title}</h3>
                        <p className="case-card__description">{notification.body}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState>Sem notificações recentes.</EmptyState>
                )}
              </Panel>
            </aside>
          </section>
        </AsyncContent>
      </PageContainer>
    </AppLayout>
  )
}
