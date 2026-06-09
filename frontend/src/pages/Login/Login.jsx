import { Link, useNavigate } from 'react-router-dom'

import { Panel } from '@components/layout/Panel'

export function Login() {
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div>
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link className="brand-mark" to="/">
            TRATTO
          </Link>
          <span className="muted-label">Acesso mockado</span>
        </div>
      </header>

      <main className="page-container">
        <Panel
          as="form"
          bodyClassName="form-grid"
          className="login-panel"
          onSubmit={handleSubmit}
          subtitle="Login visual apenas. Por enquanto qualquer tentativa abre o painel."
          title="Entrar no cartório"
          titleAs="h1"
        >
            <div className="field">
              <label className="field__label" htmlFor="login-email">
                E-mail ou usuário
              </label>
              <input
                autoComplete="username"
                className="input"
                id="login-email"
                placeholder="@marcosf"
                type="text"
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="login-password">
                Senha
              </label>
              <input
                autoComplete="current-password"
                className="input"
                id="login-password"
                placeholder="Qualquer senha serve por enquanto"
                type="password"
              />
            </div>

            <p className="notice">
              Autenticação real ainda não faz parte deste escopo. Este botão só
              simula a entrada para validar navegação e hierarquia visual.
            </p>

            <button className="button button--primary button--full" type="submit">
              Entrar
            </button>
            <Link className="button button--ghost button--full" to="/">
              Voltar para a home
            </Link>
        </Panel>
      </main>
    </div>
  )
}
