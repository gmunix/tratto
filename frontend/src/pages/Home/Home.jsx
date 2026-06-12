import { Link } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { StatCard } from '@components/common/StatCard'
import { StatusBadge } from '@components/common/StatusBadge'
import { mockTrattos } from '@/data/mockTrattos'

export function Home() {
  const previewTrattos = mockTrattos.slice(0, 3)

  return (
    <div>
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link className="brand-mark" to="/">
            TRATTO
          </Link>
          <div className="button-row" style={{ alignItems: 'center' }}>
            <Button to="/login">
              Entrar
            </Button>
          </div>
        </div>
      </header>

      <main className="page-container">
        <section className="hero hero--single">
          <div className="hero__copy">
            <div>
              <p className="kicker">Cartório social de combinados</p>
              <p className="muted-label">Legalmente inútil. Socialmente vinculante.</p>
            </div>

            <div className="stack stack--large">
              <h1 className="brand-mark brand-mark--large">TRATTO</h1>
              <p className="hero__lead">
                Crie acordos, desafios e tratos entre amigos com regras claras,
                evidências registradas e vereditos que ninguém pediu, mas todo
                mundo vai respeitar no grupo.
              </p>
            </div>

            <div className="hero__actions">
              <Button to="/registrar">
                Criar conta
              </Button>
              <Button to="/login" variant="secondary">
                Entrar
              </Button>
            </div>

            <p className="notice">
              O Tratto não é uma plataforma de apostas financeiras. Aqui o risco
              máximo recomendado é perder a pose, pagar um café ou admitir que
              falou demais.
            </p>
          </div>

        </section>

        <section className="stack stack--large">
          <div>
            <p className="section-title">Casos em circulação</p>
            <p className="section-subtitle">
              Exemplos de tratos mockados, prontos para serem trocados por dados
              reais quando a API existir.
            </p>
          </div>

          <div className="stats-grid">
            <StatCard label="Tratos registrados" value="2.847" />
            <StatCard label="Provas anexadas" value="9.104" />
            <StatCard label="Vereditos emitidos" value="1.203" />
            <StatCard label="Amizades testadas" value="892" />
          </div>

          <div className="card-grid">
            {previewTrattos.map((tratto) => (
              <Link className="case-card" key={tratto.id} to={`/trattos/${tratto.id}`}>
                <div className="case-card__header">
                  <div className="stack" style={{ gap: 6 }}>
                    <span className="muted-label">{tratto.caseNumber}</span>
                    <h3 className="case-card__title">{tratto.title}</h3>
                  </div>
                  <StatusBadge status={tratto.status} />
                </div>
                <p className="case-card__description">{tratto.description}</p>
                <p className="notice">Consequência: {tratto.consequence}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
