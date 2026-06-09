import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { InfoRow } from '@components/common/InfoRow'
import { ProgressBar } from '@components/common/ProgressBar'
import { StatusBadge } from '@components/common/StatusBadge'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { decisionMethodLabels, getTrattoById } from '@/data/mockTrattos'

const evidenceTypeLabels = {
  text: 'Texto',
  image: 'Imagem',
  link: 'Link',
}

export function TrattoDetail() {
  const { trattoId } = useParams()
  const tratto = getTrattoById(trattoId)
  const [evidenceType, setEvidenceType] = useState('text')
  const [evidenceText, setEvidenceText] = useState('')
  const [localEvidence, setLocalEvidence] = useState([])

  if (!tratto) {
    return (
      <AppLayout backTo="/dashboard" title="Caso não encontrado">
        <PageContainer>
          <EmptyState>Este trato não consta nos arquivos do cartório social.</EmptyState>
        </PageContainer>
      </AppLayout>
    )
  }

  const allEvidence = [...tratto.evidence, ...localEvidence]
  const isOpen = ['active', 'review'].includes(tratto.status)
  const isClosed = ['finished', 'loser-detected', 'cancelled'].includes(tratto.status)

  function submitEvidence(event) {
    event.preventDefault()

    if (!evidenceText.trim()) {
      return
    }

    setLocalEvidence((currentEvidence) => [
      ...currentEvidence,
      {
        id: `local-${Date.now()}`,
        author: 'Você',
        type: evidenceType,
        content: evidenceText.trim(),
        createdAt: new Date().toLocaleString('pt-BR'),
      },
    ])
    setEvidenceText('')
  }

  return (
    <AppLayout backTo="/dashboard" title={tratto.caseNumber}>
      <PageContainer className="page-grid">
        <div className="stack stack--large">
          <Panel bodyClassName="stack stack--large">
              <div className="case-card__header">
                <div className="stack" style={{ gap: 8 }}>
                  <span className="muted-label">{tratto.category}</span>
                  <h1 className="case-card__title">{tratto.title}</h1>
                </div>
                <StatusBadge status={tratto.status} />
              </div>

              <p className="case-card__description">{tratto.description}</p>
              <ProgressBar label="Andamento do trato" value={tratto.progress} />
          </Panel>

          {isClosed ? (
            <Panel
              subtitle="Este caso foi arquivado para consultas futuras e eventuais constrangimentos em reuniões de amigos."
              title="Veredito registrado"
            />
          ) : null}

          <Panel
            actions={<span className="muted-label">{allEvidence.length} itens</span>}
            title="Registro de evidências"
          >
              {allEvidence.length ? (
                <div className="timeline">
                  {allEvidence.map((evidence) => (
                    <article className="timeline-item" key={evidence.id}>
                      <div className="timeline-item__header">
                        <div>
                          <p className="section-title">{evidence.author}</p>
                          <p className="muted-label">{evidence.createdAt}</p>
                        </div>
                        <span className="status-badge" data-status="finished">
                          {evidenceTypeLabels[evidence.type] ?? evidence.type}
                        </span>
                      </div>
                      <p className="timeline-item__content">{evidence.content}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState>Nenhuma evidência enviada ainda.</EmptyState>
              )}
          </Panel>

          {isOpen ? (
            <Panel as="form" bodyClassName="form-grid" onSubmit={submitEvidence} title="Enviar evidência">
                <div className="chip-row">
                  {Object.entries(evidenceTypeLabels).map(([type, label]) => (
                    <Button
                      key={type}
                      onClick={() => setEvidenceType(type)}
                      type="button"
                      variant={evidenceType === type ? 'primary' : 'secondary'}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <label className="field__label" htmlFor="evidence-content">
                  Conteúdo da evidência
                </label>
                <textarea
                  className="textarea"
                  id="evidence-content"
                  onChange={(event) => setEvidenceText(event.target.value)}
                  placeholder="Descreva a prova, cole um link ou registre uma confissão cuidadosamente redigida."
                  value={evidenceText}
                />
                <Button disabled={!evidenceText.trim()} type="submit">
                  Enviar ao conselho
                </Button>
            </Panel>
          ) : null}
        </div>

        <aside className="stack stack--large">
          <Panel bodyClassName="stack" title="Detalhes do caso">
              <InfoRow label="Partes" value={tratto.participants.join(' contra ')} />
              <InfoRow label="Prazo" value={tratto.deadline} />
              <InfoRow label="Registrado em" value={tratto.createdAt} />
              <InfoRow label="Consequência" value={tratto.consequence} />
              <InfoRow label="Decisão" value={decisionMethodLabels[tratto.decisionMethod]} />
              {tratto.judge ? <InfoRow label="Juiz" value={tratto.judge} /> : null}
          </Panel>

          <Panel bodyClassName="stack" title="Regras">
              {tratto.rules.split('\n').map((rule) => (
                <p className="notice" key={rule}>
                  {rule}
                </p>
              ))}
          </Panel>

          {tratto.status === 'active' ? (
            <Panel
              bodyClassName="stack"
              subtitle="Ação mockada. Futuramente enviaremos isso para a rota de votos ou veredito."
              title="Solicitar julgamento"
            >
                <div className="button-row button-row--stack-mobile">
                  <Button type="button">
                    Chamar veredito
                  </Button>
                  <Button type="button" variant="ghost">
                    Estender prazo
                  </Button>
                </div>
            </Panel>
          ) : null}
        </aside>
      </PageContainer>
    </AppLayout>
  )
}
