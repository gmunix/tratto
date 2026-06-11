import { Link } from 'react-router-dom'

import { ProgressBar } from '@components/common/ProgressBar'
import { StatusBadge } from '@components/common/StatusBadge'
import { decisionMethodLabels, getParticipantNames } from '@/data/mockTrattos'

export function TrattoCard({ tratto, dimmed = false }) {
  return (
    <Link
      className="case-card"
      style={{ opacity: dimmed ? 0.72 : 1 }}
      to={`/trattos/${tratto.id}`}
    >
      <div className="case-card__header">
        <div className="stack" style={{ gap: 6 }}>
          <span className="muted-label">
            {tratto.caseNumber} / {tratto.category}
          </span>
          <h3 className="case-card__title">{tratto.title}</h3>
        </div>
        <StatusBadge status={tratto.status} />
      </div>

      <p className="case-card__description">{tratto.description}</p>

      <div className="case-card__meta">
        <span>{getParticipantNames(tratto).join(' contra ')}</span>
        <span>{decisionMethodLabels[tratto.decisionMethod]}</span>
      </div>

      {tratto.status === 'active' || tratto.status === 'review' ? (
        <ProgressBar label={`Prazo ${tratto.deadline}`} value={tratto.progress} />
      ) : null}

      <div className="notice">Consequência: {tratto.consequence}</div>
    </Link>
  )
}
