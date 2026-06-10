import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Painel', path: '/dashboard', Icon: LayoutGridIcon },
  { label: 'Novo', path: '/novo', Icon: PlusIcon },
  { label: 'Perfil', path: '/perfil', Icon: UserIcon },
]

export function AppLayout({ children }) {
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
            <item.Icon />
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

function UserIcon() {
  return (
    <svg className="bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
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
