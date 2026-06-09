export function InfoRow({ label, value }) {
  return (
    <div className="profile-row">
      <span className="muted-label">{label}</span>
      <span className="profile-row__value">{value}</span>
    </div>
  )
}
