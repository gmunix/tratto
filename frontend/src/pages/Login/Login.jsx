import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
import { Panel } from '@components/layout/Panel'
import { login } from '@/services/session'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('marcos@example.com')
  const [password, setPassword] = useState('Senha123!')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Credenciais recusadas pelo cartório. Tente o usuário seedado.')
    } finally {
      setIsSubmitting(false)
    }
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
          subtitle="Use o usuário seedado para testar o backend real. Depois trocamos por cadastro completo."
          title="Entrar no cartório"
          titleAs="h1"
        >
            <Field htmlFor="login-email" label="E-mail ou usuário">
              <input
                autoComplete="username"
                className="input"
                id="login-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="marcos@example.com"
                type="email"
                value={email}
              />
            </Field>

            <Field htmlFor="login-password" label="Senha">
              <input
                autoComplete="current-password"
                className="input"
                id="login-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha123!"
                type="password"
                value={password}
              />
            </Field>

            <p className="notice">
              Usuário seedado: marcos@example.com / Senha123!. O token fica salvo localmente para ligar as telas à API.
            </p>
            {error ? <p className="pixel-feedback">{error}</p> : null}

            <Button disabled={isSubmitting} fullWidth type="submit">
              {isSubmitting ? 'Conferindo ata...' : 'Entrar'}
            </Button>
            <Button fullWidth to="/" variant="ghost">
              Voltar para a home
            </Button>
        </Panel>
      </main>
    </div>
  )
}
