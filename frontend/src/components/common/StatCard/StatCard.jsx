export function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="muted-label">{label}</span>
      <div className="stat-card__value">{value}</div>
    </div>
  )
}
