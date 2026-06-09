export function PageContainer({ children, className = '' }) {
  return <div className={`page-container${className ? ` ${className}` : ''}`}>{children}</div>
}
