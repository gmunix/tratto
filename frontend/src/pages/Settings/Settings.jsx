import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AsyncContent } from '@components/common/AsyncContent'
import { describeApiError } from '@utils/describeApiError'
import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { getColorScheme, saveColorScheme } from '@/config/theme'
import { updateMe, updateTheme } from '@/services/backend'
import { getSession, logout, refreshCurrentUser, saveSession } from '@/services/session'

export function Settings() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getColorScheme)
  const [savedMessage, setSavedMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const savedTimeoutRef = useRef(null)

  const loadProfile = useCallback(async () => {
    try {
      const user = await refreshCurrentUser()
      setProfile(user)
      setTheme(user.theme)
      setLoadError('')
    } catch (apiError) {
      setLoadError(describeApiError(apiError, 'Não foi possível carregar o perfil.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile()
  }, [loadProfile])

  function retryLoad() {
    setLoading(true)
    setLoadError('')
    loadProfile()
  }

  useEffect(() => {
    saveColorScheme(theme)
  }, [theme])

  useEffect(() => {
    return () => window.clearTimeout(savedTimeoutRef.current)
  }, [])

  async function handleLogout() {
    setSigningOut(true)
    try {
      await logout()
    } catch {
      // logout still clears local session
    }
    navigate('/login', { replace: true })
  }

  function showSaved(message) {
    window.clearTimeout(savedTimeoutRef.current)
    setSavedMessage(message)
    savedTimeoutRef.current = window.setTimeout(() => setSavedMessage(''), 2200)
  }

  async function applyTheme(nextTheme) {
    setTheme(nextTheme)
    setProfileError('')

    try {
      const user = await updateTheme(nextTheme)
      saveSession(getSession().token, user)
      showSaved(`Tema ${nextTheme} aplicado.`)
    } catch (apiError) {
      setProfileError(describeApiError(apiError, 'Não foi possível salvar o tema.'))
    }
  }

  async function submitProfile(event) {
    event.preventDefault()
    setProfileError('')

    const formData = new FormData(event.currentTarget)
    try {
      const user = await updateMe({
        displayName: formData.get('displayName'),
        slug: formData.get('slug'),
        avatarUrl: formData.get('avatarUrl') || null,
      })
      saveSession(getSession().token, user)
      setProfile(user)
      showSaved('Perfil atualizado.')
    } catch (apiError) {
      setProfileError(describeApiError(apiError, 'Perfil rejeitado pela API.'))
    }
  }

  return (
    <AppLayout title="Ajustes">
      <PageContainer className="page-grid">
        <AsyncContent error={loadError} loading={loading} onRetry={retryLoad}>
          {profile ? (
            <>
              <div className="stack stack--large">
                <Panel as="form" bodyClassName="form-grid" onSubmit={submitProfile} title="Perfil" titleAs="h1">
                  <div className="avatar-placeholder">{getInitials(profile.displayName)}</div>
                  <Field htmlFor="display-name" label="Nome exibido">
                    <input className="input" defaultValue={profile.displayName ?? ''} id="display-name" name="displayName" />
                  </Field>
                  <Field htmlFor="user-slug" label="Slug público">
                    <input className="input" defaultValue={profile.slug ?? ''} id="user-slug" name="slug" />
                  </Field>
                  <Field htmlFor="avatar-url" label="Avatar URL">
                    <input className="input" defaultValue={profile.avatarUrl ?? ''} id="avatar-url" name="avatarUrl" />
                  </Field>
                  <Button type="submit">Salvar perfil</Button>
                  {profileError ? <p className="pixel-feedback">{profileError}</p> : null}
                  {savedMessage ? <p className="pixel-feedback">{savedMessage}</p> : null}
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
                  <p className="notice">Sessão atual como @{profile.slug}.</p>
                  <Button disabled={signingOut} onClick={handleLogout} type="button" variant="ghost">
                    {signingOut ? 'Saindo...' : 'Sair da conta'}
                  </Button>
                </Panel>
              </aside>
            </>
          ) : null}
        </AsyncContent>
      </PageContainer>
    </AppLayout>
  )
}

function getInitials(name) {
  if (!name) {
    return '??'
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
