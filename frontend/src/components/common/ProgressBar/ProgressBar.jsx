export function ProgressBar({ value, label = 'Progresso' }) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100)

  return (
    <div className="progress">
      <div className="progress__track" aria-hidden="true">
        <div className="progress__bar" style={{ width: `${safeValue}%` }} />
      </div>
      <div className="progress__meta">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
    </div>
  )
}
