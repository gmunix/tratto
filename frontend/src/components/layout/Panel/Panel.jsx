import { SectionHeader } from '@components/layout/SectionHeader'

export function Panel({
  actions,
  as: Component = 'section',
  bodyClassName = '',
  children,
  className = '',
  subtitle,
  title,
  titleAs,
  ...props
}) {
  const hasHeader = title || subtitle || actions
  const hasBody = children !== undefined && children !== null

  return (
    <Component className={`panel${className ? ` ${className}` : ''}`} {...props}>
      {hasHeader ? (
        <div className="panel__header">
          {title || subtitle ? (
            <SectionHeader subtitle={subtitle} title={title} titleAs={titleAs} />
          ) : null}
          {actions}
        </div>
      ) : null}
      {hasBody ? (
        <div className={`panel__body${bodyClassName ? ` ${bodyClassName}` : ''}`}>
          {children}
        </div>
      ) : null}
    </Component>
  )
}
