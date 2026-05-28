import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main className="page-container">
      <section className="empty-state stack">
        <h1 className="section-title">Página não encontrada</h1>
        <p className="section-subtitle">
          Este documento não consta no arquivo oficial do Tratto.
        </p>
        <Link className="button button--primary" to="/dashboard">
          Voltar ao painel
        </Link>
      </section>
    </main>
  )
}
