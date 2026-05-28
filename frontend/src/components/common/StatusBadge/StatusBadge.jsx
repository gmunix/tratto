import { statusLabels } from '@/data/mockTrattos'

export function StatusBadge({ status }) {
  return (
    <span className="status-badge" data-status={status}>
      {statusLabels[status] ?? 'Sem status'}
    </span>
  )
}
