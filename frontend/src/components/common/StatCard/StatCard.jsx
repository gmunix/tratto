export function StatCard({ tone = 'accent', label, value }) {
  return (
    <div className="stat-card" data-tone={tone}>
      <span className="muted-label">{label}</span>
      <div className="stat-card__value">{value}</div>
    </div>
  )
}
