export function SectionHeader({ title, subtitle, titleAs: Title = 'h2' }) {
  return (
    <div>
      {title ? <Title className="section-title">{title}</Title> : null}
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  )
}
