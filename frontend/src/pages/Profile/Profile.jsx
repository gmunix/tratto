import { Link } from 'react-router-dom'

import { AppLayout } from '@components/layout/AppLayout'
import { ProgressBar } from '@components/common/ProgressBar'
import { StatusBadge } from '@components/common/StatusBadge'
import { mockTrattos, userProfile } from '@/data/mockTrattos'

export function Profile() {
  const recentTrattos = mockTrattos.slice(0, 4)

  return (
    <AppLayout title="Perfil e histórico">
      <main className="page-container page-grid">
        <div className="stack stack--large">
          <section className="panel">
            <div className="panel__body stack stack--large">
              <div className="case-card__header">
                <div className="button-row" style={{ alignItems: 'center' }}>
                  <div className="mascot" aria-hidden="true">
                    {userProfile.initials}
                  </div>
                  <div>
                    <p className="muted-label">ID {userProfile.id}</p>
                    <h1 className="case-card__title">{userProfile.name}</h1>
                    <p className="section-subtitle">{userProfile.username}</p>
                  </div>
                </div>
                <span className="status-badge" data-status="active">
                  Parte ativa
                </span>
              </div>

              <ProgressBar label="Reputação social" value={userProfile.reputation} />
            </div>
          </section>

          <section className="stats-grid">
            <StatCard label="Vitórias" value={userProfile.wins} />
            <StatCard label="Derrotas" value={userProfile.losses} />
            <StatCard label="Ativos" value={userProfile.active} />
            <StatCard label="Pendências" value={userProfile.pending} />
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2 className="section-title">Badges e reputação</h2>
            </div>
            <div className="panel__body badge-list">
              {userProfile.badges.map((badge) => (
                <article className="profile-badge" key={badge.id}>
                  <p className="profile-badge__name">{badge.name}</p>
                  <p className="section-subtitle">{badge.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="stack stack--large">
          <section className="panel">
            <div className="panel__header">
              <h2 className="section-title">Histórico recente</h2>
            </div>
            <div className="panel__body stack">
              {recentTrattos.map((tratto) => (
                <Link className="case-card" key={tratto.id} to={`/trattos/${tratto.id}`}>
                  <div className="case-card__header">
                    <div>
                      <p className="muted-label">{tratto.caseNumber}</p>
                      <h3 className="case-card__title">{tratto.title}</h3>
                    </div>
                    <StatusBadge status={tratto.status} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2 className="section-title">Perfil psicológico oficial</h2>
            </div>
            <div className="panel__body stack">
              <InfoRow label="Melhor desculpa" value="Tecnicamente eu não prometi isso." />
              <InfoRow label="Qualidade das provas" value="Convincente com ressalvas." />
              <InfoRow label="Recursos abertos" value={String(userProfile.disputed)} />
              <InfoRow label="Risco social" value="Moderado, porém recorrente." />
            </div>
          </section>
        </aside>
      </main>
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

function InfoRow({ label, value }) {
  return (
    <div className="profile-row">
      <span className="muted-label">{label}</span>
      <span className="profile-row__value">{value}</span>
    </div>
  )
}
