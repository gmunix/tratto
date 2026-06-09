import { Button } from '@components/common/Button'

export function NotFound() {
  return (
    <main className="page-container">
      <section className="empty-state stack">
        <h1 className="section-title">Página não encontrada</h1>
        <p className="section-subtitle">
          Este documento não consta no arquivo oficial do Tratto.
        </p>
        <Button to="/login">
          Ir para entrada
        </Button>
      </section>
    </main>
  )
}
