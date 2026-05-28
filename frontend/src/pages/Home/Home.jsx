import { Link } from 'react-router-dom'

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
            <span className="muted-label">Reg. TRT-0001</span>
            <Link className="button button--primary" to="/login">
              Entrar
            </Link>
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
              <Link className="button button--primary" to="/login">
                Abrir painel
              </Link>
              <Link className="button button--secondary" to="/login">
                Registrar trato
              </Link>
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
            <div className="stat-card">
              <span className="muted-label">Tratos registrados</span>
              <div className="stat-card__value">2.847</div>
            </div>
            <div className="stat-card">
              <span className="muted-label">Provas anexadas</span>
              <div className="stat-card__value">9.104</div>
            </div>
            <div className="stat-card">
              <span className="muted-label">Vereditos emitidos</span>
              <div className="stat-card__value">1.203</div>
            </div>
            <div className="stat-card">
              <span className="muted-label">Amizades testadas</span>
              <div className="stat-card__value">892</div>
            </div>
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
