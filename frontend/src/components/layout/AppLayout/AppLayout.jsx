import { Link, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { label: 'Painel', path: '/dashboard', glyph: 'C' },
  { label: 'Novo', path: '/novo', glyph: '+' },
  { label: 'Perfil', path: '/perfil', glyph: 'P' },
]

export function AppLayout({ title, eyebrow = 'TRATTO', backTo, actions, children }) {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="stack" style={{ gap: 4 }}>
            <div className="button-row" style={{ alignItems: 'center' }}>
              {backTo ? (
                <button
                  className="button button--ghost"
                  onClick={() => navigate(backTo)}
                  type="button"
                >
                  Voltar
                </button>
              ) : null}
              <span className="muted-label">{eyebrow}</span>
            </div>
            {title ? <h1 className="section-title">{title}</h1> : null}
          </div>

          <div className="button-row" style={{ alignItems: 'center' }}>
            {actions}
            <Link className="brand-mark" to="/">
              TRATTO
            </Link>
          </div>
        </div>
      </header>

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
            <span className="nav-glyph">{item.glyph}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
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
