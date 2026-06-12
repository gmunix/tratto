import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { getNotifications } from '@/services/backend'
import { getSession, subscribeToSession } from '@/services/session'

export function AppLayout({ children }) {
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    async function refreshUnreadCount() {
      if (!getSession().token) {
        setUnreadNotifications(0)
        return
      }

      try {
        const data = await getNotifications()
        setUnreadNotifications(data.unreadCount)
      } catch {
        setUnreadNotifications(0)
      }
    }

    const unsubscribeSession = subscribeToSession(refreshUnreadCount)
    window.addEventListener('tratto-notifications-changed', refreshUnreadCount)

    refreshUnreadCount()

    return () => {
      unsubscribeSession()
      window.removeEventListener('tratto-notifications-changed', refreshUnreadCount)
    }
  }, [])

  const navItems = [
    { label: 'Painel', path: '/dashboard', Icon: LayoutGridIcon },
    { label: 'Novo', path: '/novo', Icon: PlusIcon },
    { label: 'Comunidades', path: '/comunidades', Icon: CommunityIcon },
    { label: 'Notificações', path: '/notificacoes', Icon: BellIcon, unread: unreadNotifications },
    { label: 'Ajustes', path: '/ajustes', Icon: SettingsIcon },
  ]

  return (
    <div className="app-shell">
      <main>{children}</main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `bottom-nav__link${isActive ? ' is-active' : ''}`
            }
            key={item.path}
            to={item.path}
          >
            <span className="bottom-nav__icon-wrap">
              <item.Icon />
              {item.unread ? <span className="bottom-nav__dot">{item.unread}</span> : null}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function LayoutGridIcon() {
  return (
    <svg className="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg className="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 21v-6" />
      <path d="M16 21v-6" />
      <path d="M3 21h18" />
      <path d="M5 15h14" />
      <path d="M7 15V7l5-4 5 4v8" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.6 5.6 2.1 2.1" />
      <path d="m16.3 16.3 2.1 2.1" />
      <path d="m18.4 5.6-2.1 2.1" />
      <path d="m7.7 16.3-2.1 2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function PixelMascot() {
  return (
    <span className="mascot" aria-hidden="true">
      <svg viewBox="0 0 16 16" role="img">
        <rect x="4" y="0" width="8" height="3" fill="var(--color-text)" />
        <rect x="3" y="2" width="10" height="2" fill="var(--color-accent)" />
        <rect x="4" y="4" width="8" height="5" fill="var(--color-highlight)" />
        <rect x="5" y="6" width="2" height="2" fill="var(--color-bg)" />
        <rect x="9" y="5" width="3" height="3" fill="var(--color-accent)" />
        <rect x="10" y="6" width="1" height="1" fill="var(--color-bg)" />
        <rect x="6" y="9" width="4" height="1" fill="var(--color-bg)" />
        <rect x="3" y="10" width="10" height="6" fill="var(--color-text)" />
        <rect x="5" y="10" width="2" height="3" fill="var(--color-surface)" />
        <rect x="9" y="10" width="2" height="3" fill="var(--color-surface)" />
        <rect x="7" y="11" width="2" height="2" fill="var(--color-accent)" />
      </svg>
    </span>
  )
}
