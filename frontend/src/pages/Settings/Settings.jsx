import { useEffect, useState } from 'react'

import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { getColorScheme, saveColorScheme } from '@/config/theme'
import { currentUser } from '@/data/mockTrattos'

export function Settings() {
  const [theme, setTheme] = useState(getColorScheme)

  useEffect(() => {
    saveColorScheme(theme)
  }, [theme])

  function applyTheme(nextTheme) {
    setTheme(nextTheme)
  }

  return (
    <AppLayout title="Ajustes">
      <PageContainer className="page-grid">
        <div className="stack stack--large">
          <Panel bodyClassName="form-grid" title="Perfil" titleAs="h1">
            <div className="avatar-placeholder">{currentUser.initials}</div>
            <Field htmlFor="display-name" label="Nome exibido">
              <input className="input" defaultValue={currentUser.name} id="display-name" />
            </Field>
            <Field htmlFor="user-slug" label="Slug público">
              <input className="input" defaultValue={currentUser.slug} id="user-slug" />
            </Field>
          </Panel>

          <Panel bodyClassName="form-grid" title="Notificações">
            <label className="toggle-row">
              <span>Alertas no app</span>
              <input defaultChecked type="checkbox" />
            </label>
            <label className="toggle-row">
              <span>Resumo por email</span>
              <input type="checkbox" />
            </label>
            <label className="toggle-row">
              <span>Manter itens novos destacados</span>
              <input defaultChecked type="checkbox" />
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
            <p className="notice">Login mockado como @{currentUser.slug}. Backend de autenticação entra em fase futura.</p>
            <Button type="button" variant="ghost">Zona de perigo decorativa</Button>
          </Panel>
        </aside>
      </PageContainer>
    </AppLayout>
  )
}
