import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
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
            <Field htmlFor="login-email" label="E-mail ou usuário">
              <input
                autoComplete="username"
                className="input"
                id="login-email"
                placeholder="@marcosf"
                type="text"
              />
            </Field>

            <Field htmlFor="login-password" label="Senha">
              <input
                autoComplete="current-password"
                className="input"
                id="login-password"
                placeholder="Qualquer senha serve por enquanto"
                type="password"
              />
            </Field>

            <p className="notice">
              Autenticação real ainda não faz parte deste escopo. Este botão só
              simula a entrada para validar navegação e hierarquia visual.
            </p>

            <Button fullWidth type="submit">
              Entrar
            </Button>
            <Button fullWidth to="/" variant="ghost">
              Voltar para a home
            </Button>
        </Panel>
      </main>
    </div>
  )
}
