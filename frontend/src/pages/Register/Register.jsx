import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
import { Panel } from '@components/layout/Panel'
import { register } from '@/services/session'
import { describeApiError } from '@utils/describeApiError'

const slugPattern = /^[a-z0-9-]{3,32}$/

function suggestSlug(displayName) {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function Register() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleDisplayNameChange(event) {
    const value = event.target.value
    setDisplayName(value)
    if (!slugTouched) {
      setSlug(suggestSlug(value))
    }
  }

  function handleSlugChange(event) {
    setSlug(event.target.value.toLowerCase())
    setSlugTouched(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Informe um nome.')
      return
    }

    if (password.length < 8) {
      setError('A senha precisa ter ao menos 8 caracteres.')
      return
    }

    if (!slugPattern.test(slug)) {
      setError('Slug deve ter entre 3 e 32 caracteres, usando apenas letras minúsculas, números e hífen.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({ email: email.trim(), password, displayName: displayName.trim(), slug })
      navigate('/dashboard', { replace: true })
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível registrar a conta.'))
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
          <span className="muted-label">Novo cadastro</span>
        </div>
      </header>

      <main className="page-container">
        <Panel
          as="form"
          bodyClassName="form-grid"
          className="login-panel"
          onSubmit={handleSubmit}
          subtitle="Crie uma conta para registrar tratos com seus amigos."
          title="Abrir matrícula"
          titleAs="h1"
        >
          <Field htmlFor="register-name" label="Nome exibido">
            <input
              autoComplete="name"
              className="input"
              id="register-name"
              onChange={handleDisplayNameChange}
              placeholder="Ex: Marcos Ferreira"
              value={displayName}
            />
          </Field>

          <Field hint="Letras minúsculas, números e hífen." htmlFor="register-slug" label="Slug público">
            <input
              autoComplete="username"
              className="input"
              id="register-slug"
              onChange={handleSlugChange}
              placeholder="marcosf"
              value={slug}
            />
          </Field>

          <Field htmlFor="register-email" label="E-mail">
            <input
              autoComplete="email"
              className="input"
              id="register-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@example.com"
              type="email"
              value={email}
            />
          </Field>

          <Field hint="Mínimo 8 caracteres." htmlFor="register-password" label="Senha">
            <input
              autoComplete="new-password"
              className="input"
              id="register-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </Field>

          {error ? <p className="pixel-feedback">{error}</p> : null}

          <Button disabled={isSubmitting} fullWidth type="submit">
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </Button>
          <Button fullWidth to="/login" variant="ghost">
            Já tenho conta
          </Button>
        </Panel>
      </main>
    </div>
  )
}
