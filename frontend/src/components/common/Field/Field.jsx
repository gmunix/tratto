export function Field({ children, hint, htmlFor, label }) {
  return (
    <div className="field">
      {htmlFor ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="field__label">{label}</span>
      )}
      {hint ? <span className="field__hint">{hint}</span> : null}
      {children}
    </div>
  )
}
