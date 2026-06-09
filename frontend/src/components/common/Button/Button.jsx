import { Link } from 'react-router-dom'

export function Button({
  children,
  className = '',
  disabled = false,
  fullWidth = false,
  onClick,
  tabIndex,
  to,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = [
    'button',
    variant ? `button--${variant}` : '',
    fullWidth ? 'button--full' : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link
        aria-disabled={disabled || undefined}
        className={classes}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault()
            return
          }

          onClick?.(event)
        }}
        tabIndex={disabled ? -1 : tabIndex}
        to={to}
        {...props}
      >
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type} {...props}>
      {children}
    </button>
  )
}
