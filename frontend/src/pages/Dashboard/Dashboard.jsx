import { Link } from 'react-router-dom'

import { AppLayout } from '@components/layout/AppLayout'
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
        <Link className="button button--primary" to="/novo">
          Novo trato
        </Link>
      }
      title="Painel de controle"
    >
      <div className="page-container stack stack--large">
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
                <EmptyState text="Nenhum trato ativo no momento." />
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
                      <div className="button-row">
                        <button className="button button--primary" type="button">
                          Aceitar
                        </button>
                        <button className="button button--ghost" type="button">
                          Recusar
                        </button>
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
      </div>
    </AppLayout>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="muted-label">{label}</span>
      <div className="stat-card__value">{value}</div>
    </div>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      <div className="panel__body">{children}</div>
    </section>
  )
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>
}
