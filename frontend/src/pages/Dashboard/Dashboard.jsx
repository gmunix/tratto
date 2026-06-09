import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { StatCard } from '@components/common/StatCard'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { TrattoCard } from '@components/features/trattos/TrattoCard'
import { mockTrattos, pendingInvites } from '@/data/mockTrattos'

export function Dashboard() {
  const activeTrattos = mockTrattos.filter((tratto) => tratto.status === 'active')
  const pendingTrattos = mockTrattos.filter((tratto) => tratto.status === 'pending')
  const reviewTrattos = mockTrattos.filter((tratto) => tratto.status === 'review')
  const closedTrattos = mockTrattos.filter((tratto) =>
    ['finished', 'loser-detected', 'cancelled'].includes(tratto.status),
  )

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
        <section className="stats-grid">
          <StatCard label="Ativos" value={activeTrattos.length} />
          <StatCard label="Pendentes" value={pendingTrattos.length + pendingInvites.length} />
          <StatCard label="Em julgamento" value={reviewTrattos.length} />
          <StatCard label="Arquivados" value={closedTrattos.length} />
        </section>

        <section className="page-grid">
          <div className="stack stack--large">
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
              title="Aguardando decisão"
            >
              <div className="stack">
                {reviewTrattos.map((tratto) => (
                  <TrattoCard key={tratto.id} tratto={tratto} />
                ))}
              </div>
            </Panel>

            <Panel subtitle="Material arquivado para constrangimentos futuros." title="Histórico recente">
              <div className="stack">
                {closedTrattos.map((tratto) => (
                  <TrattoCard dimmed key={tratto.id} tratto={tratto} />
                ))}
              </div>
            </Panel>
          </div>

          <aside className="stack stack--large">
            <Panel title="Convites pendentes">
              <div className="stack">
                {pendingInvites.map((invite) => (
                  <article className="invite-card" key={invite.id}>
                    <div className="stack" style={{ gap: 6 }}>
                      <span className="muted-label">Enviado por {invite.from}</span>
                      <h3 className="case-card__title">{invite.title}</h3>
                    </div>
                    <p className="case-card__description">Consequência: {invite.consequence}</p>
                    <div className="invite-card__footer">
                      <span className="muted-label">Prazo {invite.deadline}</span>
                      <div className="button-row button-row--stack-mobile">
                        <Button type="button">
                          Aceitar
                        </Button>
                        <Button type="button" variant="ghost">
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Checklist burocrático">
              <div className="stack">
                <p className="notice">1. Defina regras antes da coragem acabar.</p>
                <p className="notice">2. Colete evidências antes da memória virar opinião.</p>
                <p className="notice">3. Emita veredito com firmeza e pouca base legal.</p>
              </div>
            </Panel>
          </aside>
        </section>
      </PageContainer>
    </AppLayout>
  )
}
