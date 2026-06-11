import { useEffect, useRef, useState } from 'react'

import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { getColorScheme, saveColorScheme } from '@/config/theme'
import { currentUser } from '@/data/mockTrattos'
import { updateMe, updateTheme } from '@/services/backend'
import { getSession, refreshCurrentUser, saveSession } from '@/services/session'

export function Settings() {
  const [theme, setTheme] = useState(getColorScheme)
  const [savedMessage, setSavedMessage] = useState('')
  const [profile, setProfile] = useState(currentUser)
  const savedTimeoutRef = useRef(null)

  useEffect(() => {
    if (!getSession().token) {
      return
    }

    refreshCurrentUser()
      .then((user) => {
        setProfile({ ...currentUser, ...user, name: user.displayName })
        setTheme(user.theme)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    saveColorScheme(theme)
  }, [theme])

  useEffect(() => {
    return () => window.clearTimeout(savedTimeoutRef.current)
  }, [])

  function showSaved(message = 'Ajustes salvos localmente.') {
    window.clearTimeout(savedTimeoutRef.current)
    setSavedMessage(message)
    savedTimeoutRef.current = window.setTimeout(() => setSavedMessage(''), 2200)
  }

  async function applyTheme(nextTheme) {
    setTheme(nextTheme)

    if (getSession().token) {
      const user = await updateTheme(nextTheme)
      saveSession(getSession().token, user)
    }

    showSaved(`Tema ${nextTheme} aplicado neste usuário.`)
  }

  async function submitProfile(event) {
    event.preventDefault()

    if (getSession().token) {
      const formData = new FormData(event.currentTarget)
      const user = await updateMe({
        displayName: formData.get('displayName'),
        slug: formData.get('slug'),
        avatarUrl: formData.get('avatarUrl') || null,
      })
      saveSession(getSession().token, user)
      setProfile({ ...currentUser, ...user, name: user.displayName })
      showSaved('Perfil salvo na API.')
      return
    }

    showSaved('Perfil mockado salvo para a próxima ata.')
  }

  return (
    <AppLayout title="Ajustes">
      <PageContainer className="page-grid">
        <div className="stack stack--large">
          <Panel as="form" bodyClassName="form-grid" onSubmit={submitProfile} title="Perfil" titleAs="h1">
            <div className="avatar-placeholder">{currentUser.initials}</div>
            <Field htmlFor="display-name" label="Nome exibido">
              <input className="input" defaultValue={profile.name} id="display-name" name="displayName" />
            </Field>
            <Field htmlFor="user-slug" label="Slug público">
              <input className="input" defaultValue={profile.slug} id="user-slug" name="slug" />
            </Field>
            <Field htmlFor="avatar-url" label="Avatar URL">
              <input className="input" defaultValue={profile.avatarUrl ?? ''} id="avatar-url" name="avatarUrl" />
            </Field>
            <Button type="submit">Salvar perfil</Button>
            {savedMessage ? <p className="pixel-feedback">{savedMessage}</p> : null}
          </Panel>

          <Panel bodyClassName="form-grid" title="Notificações">
            <label className="toggle-row">
              <span>Alertas no app</span>
              <input defaultChecked onChange={() => showSaved()} type="checkbox" />
            </label>
            <label className="toggle-row">
              <span>Resumo por email</span>
              <input onChange={() => showSaved()} type="checkbox" />
            </label>
            <label className="toggle-row">
              <span>Manter itens novos destacados</span>
              <input defaultChecked onChange={() => showSaved()} type="checkbox" />
            </label>
          </Panel>
        </div>

        <aside className="stack stack--large">
          <Panel bodyClassName="stack" title="Tema deste usuário">
            {['grime', 'cassete'].map((themeName) => (
              <button
                className={`option-card${theme === themeName ? ' is-selected' : ''}`}
                key={themeName}
                onClick={() => applyTheme(themeName)}
                type="button"
              >
                <span className="section-title">{themeName}</span>
                <p className="section-subtitle">
                  {themeName === 'grime'
                    ? 'Escuro, ácido e com cara de terminal social.'
                    : 'Claro, retrô e com energia de fita cassete administrativa.'}
                </p>
              </button>
            ))}
          </Panel>

          <Panel bodyClassName="stack" title="Sessão">
            <p className="notice">Sessão atual como @{profile.slug}. O backend já responde auth/me, tema e perfil.</p>
            <Button type="button" variant="ghost">Zona de perigo decorativa</Button>
          </Panel>
        </aside>
      </PageContainer>
    </AppLayout>
  )
}
