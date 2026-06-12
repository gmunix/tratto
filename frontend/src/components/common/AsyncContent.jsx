import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'

export function AsyncContent({ loading, error, onRetry, children }) {
  if (loading) {
    return <EmptyState>Carregando...</EmptyState>
  }

  if (error) {
    return (
      <div className="async-error" role="alert">
        <p className="pixel-feedback">{error}</p>
        {onRetry ? (
          <Button onClick={onRetry} type="button" variant="secondary">
            Tentar novamente
          </Button>
        ) : null}
      </div>
    )
  }

  return children
}
