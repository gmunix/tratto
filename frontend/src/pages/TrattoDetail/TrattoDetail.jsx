import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AsyncContent } from '@components/common/AsyncContent'
import { describeApiError } from '@utils/describeApiError'
import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { Field } from '@components/common/Field'
import { InfoRow } from '@components/common/InfoRow'
import { ProgressBar } from '@components/common/ProgressBar'
import { StatusBadge } from '@components/common/StatusBadge'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { decisionMethodLabels } from '@/data/mockTrattos'
import {
  addEvidence,
  completeTratto,
  createVerdict,
  getTratto,
  requestJudgment,
  respondToInvite,
  uploadEvidence,
} from '@/services/backend'
import { environment } from '@/config/environment'
import { getSession } from '@/services/session'

const evidenceTypeLabels = {
  text: 'Texto',
  image: 'Imagem',
  link: 'Link',
}

function resolveEvidenceImageUrl(evidence) {
  const url = evidence?.metadata?.fileUrl ?? evidence?.metadata?.previewUrl
  if (!url) {
    return ''
  }
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url
  }
  const base = (environment.apiUrl ?? '').replace(/\/api\/?$/, '')
  return `${base}${url}`
}

export function TrattoDetail() {
  const { trattoId } = useParams()
  const [tratto, setTratto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [evidenceType, setEvidenceType] = useState('text')
  const [evidenceText, setEvidenceText] = useState('')
  const [evidencePhoto, setEvidencePhoto] = useState(null)
  const [evidenceFeedback, setEvidenceFeedback] = useState('')
  const [submittedEvidenceId, setSubmittedEvidenceId] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [verdictForm, setVerdictForm] = useState({ winner: '', loser: '', summary: '' })
  const evidencePhotoInputRef = useRef(null)
  const evidenceFeedbackTimeoutRef = useRef(null)
  const session = getSession()
  const sessionUserId = session.user?.id

  const loadTratto = useCallback(async () => {
    try {
      const data = await getTratto(trattoId)
      setTratto(data)
      setLoadError('')
    } catch (apiError) {
      if (apiError.response?.status === 404) {
        setTratto(null)
        setLoadError('')
      } else {
        setLoadError(describeApiError(apiError, 'Não foi possível carregar o trato.'))
      }
    } finally {
      setLoading(false)
    }
  }, [trattoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTratto()
  }, [loadTratto])

  function retryLoad() {
    setLoading(true)
    setLoadError('')
    loadTratto()
  }

  useEffect(() => {
    return () => window.clearTimeout(evidenceFeedbackTimeoutRef.current)
  }, [])

  if (loading || loadError) {
    return (
      <AppLayout backTo="/dashboard" title="Carregando trato">
        <PageContainer>
          <AsyncContent error={loadError} loading={loading} onRetry={retryLoad}>
            <span />
          </AsyncContent>
        </PageContainer>
      </AppLayout>
    )
  }

  if (!tratto) {
    return (
      <AppLayout backTo="/dashboard" title="Caso não encontrado">
        <PageContainer>
          <EmptyState>Este trato não consta nos arquivos do cartório social.</EmptyState>
        </PageContainer>
      </AppLayout>
    )
  }

  const allEvidence = tratto.evidence ?? []
  const isOpen = ['active', 'review'].includes(tratto.status)
  const isClosed = ['finished', 'loser-detected', 'cancelled'].includes(tratto.status)
  const permissions = tratto.permissions ?? {}
  const myParticipant = (tratto.participants ?? []).find(
    (entry) => entry.user?.id && entry.user.id === sessionUserId,
  )
  const hasPendingInvite = myParticipant?.inviteStatus === 'pending'
  const canRequestJudgment = Boolean(permissions.canRequestJudgment)
  const canResolveVerdict = Boolean(permissions.canResolveVerdict)
  const canComplete = Boolean(permissions.canComplete)
  const resolvableParticipants = (tratto.participants ?? []).filter(
    (entry) => entry.role !== 'judge',
  )
  const participantNames = tratto.participantNames
    ?? (tratto.participants ?? []).map((entry) => entry.displayName)

  async function submitEvidence(event) {
    event.preventDefault()
    setActionError('')

    if (!evidenceText.trim() && !(evidenceType === 'image' && evidencePhoto)) {
      return
    }

    try {
      const data =
        evidenceType === 'image' && evidencePhoto?.file
          ? await uploadEvidence(tratto.id, {
              file: evidencePhoto.file,
              type: 'image',
              caption: evidenceText.trim() || undefined,
            })
          : await addEvidence(tratto.id, {
              type: evidenceType,
              content: evidenceText.trim(),
            })

      setTratto(data.tratto)
      setEvidenceText('')
      clearEvidencePhoto()
      setEvidenceFeedback('Evidência protocolada.')
      setSubmittedEvidenceId(data.evidence.id)
      window.clearTimeout(evidenceFeedbackTimeoutRef.current)
      evidenceFeedbackTimeoutRef.current = window.setTimeout(() => {
        setEvidenceFeedback('')
        setSubmittedEvidenceId('')
      }, 2200)
    } catch (apiError) {
      setActionError(describeApiError(apiError, 'A API recusou a evidência.'))
    }
  }

  async function answerInvite(decision) {
    if (!myParticipant) {
      return
    }
    setActionBusy(true)
    setActionError('')
    try {
      const updated = await respondToInvite(tratto.id, myParticipant.id, decision)
      setTratto(updated)
    } catch (apiError) {
      setActionError(apiError.response?.data?.message ?? 'Não foi possível responder ao convite.')
    } finally {
      setActionBusy(false)
    }
  }

  async function callJudgment() {
    setActionBusy(true)
    setActionError('')
    try {
      const updated = await requestJudgment(tratto.id)
      setTratto(updated)
    } catch (apiError) {
      setActionError(apiError.response?.data?.message ?? 'Não foi possível solicitar julgamento.')
    } finally {
      setActionBusy(false)
    }
  }

  async function submitVerdict(event) {
    event.preventDefault()

    if (!verdictForm.winner || !verdictForm.loser) {
      setActionError('Selecione vencedor e perdedor.')
      return
    }

    setActionBusy(true)
    setActionError('')
    try {
      const updated = await createVerdict(tratto.id, {
        winnerParticipantId: verdictForm.winner,
        loserParticipantId: verdictForm.loser,
        summary: verdictForm.summary || undefined,
      })
      setTratto(updated)
      setVerdictForm({ winner: '', loser: '', summary: '' })
    } catch (apiError) {
      setActionError(apiError.response?.data?.message ?? 'Veredito recusado pela API.')
    } finally {
      setActionBusy(false)
    }
  }

  async function markComplete() {
    setActionBusy(true)
    setActionError('')
    try {
      const updated = await completeTratto(tratto.id)
      setTratto(updated)
    } catch (apiError) {
      setActionError(apiError.response?.data?.message ?? 'Não foi possível encerrar o trato.')
    } finally {
      setActionBusy(false)
    }
  }

  function clearEvidencePhoto() {
    setEvidencePhoto(null)
    if (evidencePhotoInputRef.current) {
      evidencePhotoInputRef.current.value = ''
    }
  }

  function handleEvidencePhotoChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      clearEvidencePhoto()
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setEvidencePhoto({ file, filename: file.name, previewUrl: String(reader.result) })
    }
    reader.readAsDataURL(file)
  }

  function selectEvidenceType(type) {
    setEvidenceType(type)
    if (type !== 'image') {
      clearEvidencePhoto()
    }
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

          {hasPendingInvite ? (
            <Panel
              subtitle={
                myParticipant?.role === 'judge'
                  ? 'Você foi convidado como juiz. Confirme para o trato seguir.'
                  : 'Convite aguardando sua resposta para o trato ficar ativo.'
              }
              title="Convite pendente"
            >
              <div className="button-row button-row--stack-mobile">
                <Button disabled={actionBusy} onClick={() => answerInvite('accepted')} type="button">
                  Aceitar
                </Button>
                <Button disabled={actionBusy} onClick={() => answerInvite('declined')} type="button" variant="ghost">
                  Recusar
                </Button>
              </div>
            </Panel>
          ) : null}

          {isClosed ? (
            <Panel
              subtitle="Este caso foi arquivado para consultas futuras e eventuais constrangimentos em reuniões de amigos."
              title="Veredito registrado"
            />
          ) : null}

          <Panel
            actions={
              <span className="muted-label evidence-count" key={allEvidence.length}>
                {allEvidence.length} itens
              </span>
            }
            title="Registro de evidências"
          >
              {allEvidence.length ? (
                <div className="timeline">
                  {allEvidence.map((evidence) => (
                    <article
                      className="timeline-item"
                      data-submitted={evidence.id === submittedEvidenceId}
                      key={evidence.id}
                    >
                      <div className="timeline-item__header">
                        <div>
                          <p className="section-title">{evidence.authorName ?? evidence.author?.displayName ?? evidence.author}</p>
                          <p className="muted-label">{evidence.createdAt}</p>
                        </div>
                        <span className="status-badge" data-status="finished">
                          {evidenceTypeLabels[evidence.type] ?? evidence.type}
                        </span>
                      </div>
                      {evidence.type === 'image' ? (
                        <div className="evidence-preview">
                          {resolveEvidenceImageUrl(evidence) ? (
                            <img
                              alt={`Prévia de ${evidence.metadata?.originalName ?? evidence.metadata?.filename ?? 'imagem'}`}
                              className="evidence-preview__image"
                              src={resolveEvidenceImageUrl(evidence)}
                            />
                          ) : (
                            <span className="evidence-preview__icon">IMG</span>
                          )}
                          <span>{evidence.metadata?.originalName ?? evidence.metadata?.filename ?? 'foto-evidencia'}</span>
                        </div>
                      ) : null}
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
                      onClick={() => selectEvidenceType(type)}
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
                {evidenceType === 'image' ? (
                  <div className={`evidence-upload-mock${evidencePhoto ? ' has-preview' : ''}`}>
                    {evidencePhoto?.previewUrl ? (
                      <img
                        alt={`Prévia de ${evidencePhoto.filename}`}
                        className="evidence-preview__image"
                        src={evidencePhoto.previewUrl}
                      />
                    ) : (
                      <span className="evidence-upload-mock__frame" />
                    )}
                    <div className="stack" style={{ gap: 8 }}>
                      <span>
                        {evidencePhoto
                          ? evidencePhoto.filename
                          : 'Escolha uma imagem (png/jpg/gif/webp, máx 5 MB).'}
                      </span>
                      <Button
                        className="evidence-upload-mock__button"
                        onClick={() => evidencePhotoInputRef.current?.click()}
                        type="button"
                        variant="secondary"
                      >
                        Escolher imagem
                      </Button>
                      <input
                        accept="image/*"
                        className="visually-hidden"
                        id="evidence-photo"
                        onChange={handleEvidencePhotoChange}
                        ref={evidencePhotoInputRef}
                        type="file"
                      />
                    </div>
                  </div>
                ) : null}
                <textarea
                  className="textarea"
                  id="evidence-content"
                  onChange={(event) => setEvidenceText(event.target.value)}
                  placeholder="Descreva a prova, cole um link ou registre uma confissão cuidadosamente redigida."
                  value={evidenceText}
                />
                <Button disabled={!evidenceText.trim() && !(evidenceType === 'image' && evidencePhoto)} type="submit">
                  Enviar ao conselho
                </Button>
                {evidenceFeedback ? (
                  <div className="evidence-submit-feedback" aria-live="polite">
                    <p className="pixel-feedback">{evidenceFeedback}</p>
                    <span className="case-filed-stamp">Protocolado</span>
                  </div>
                ) : null}
            </Panel>
          ) : null}
        </div>

        <aside className="stack stack--large">
          <Panel bodyClassName="stack" title="Detalhes do caso">
              <InfoRow label="Partes" value={participantNames.join(" contra ")} />
              <InfoRow label="Prazo" value={tratto.deadline} />
              <InfoRow label="Registrado em" value={tratto.createdAt} />
              <InfoRow label="Consequência" value={tratto.consequence} />
              <InfoRow label="Decisão" value={decisionMethodLabels[tratto.decisionMethod]} />
              {tratto.judge ? <InfoRow label="Juiz" value={tratto.judge} /> : null}
          </Panel>

          <Panel bodyClassName="stack" title="Regras">
              <ol className="rules-list">
                {tratto.rules.map((rule) => (
                  <li key={typeof rule === 'string' ? rule : rule.id}>{typeof rule === 'string' ? rule : rule.text}</li>
                ))}
              </ol>
          </Panel>

          {actionError ? <p className="pixel-feedback">{actionError}</p> : null}

          {tratto.status === 'active' && canRequestJudgment ? (
            <Panel bodyClassName="stack" title="Solicitar julgamento">
                <div className="button-row button-row--stack-mobile">
                  <Button disabled={actionBusy} onClick={callJudgment} type="button">
                    Chamar veredito
                  </Button>
                </div>
            </Panel>
          ) : null}

          {tratto.status === 'review' && canResolveVerdict ? (
            <Panel
              as="form"
              bodyClassName="form-grid"
              onSubmit={submitVerdict}
              subtitle="Registre o resultado oficial. O trato passa para fase de cumprimento."
              title="Registrar veredito"
            >
              <Field label="Vencedor">
                <select
                  className="select"
                  onChange={(event) =>
                    setVerdictForm((current) => ({ ...current, winner: event.target.value }))
                  }
                  value={verdictForm.winner}
                >
                  <option value="">Selecione</option>
                  {resolvableParticipants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.displayName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Perdedor">
                <select
                  className="select"
                  onChange={(event) =>
                    setVerdictForm((current) => ({ ...current, loser: event.target.value }))
                  }
                  value={verdictForm.loser}
                >
                  <option value="">Selecione</option>
                  {resolvableParticipants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.displayName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Resumo (opcional)">
                <textarea
                  className="textarea"
                  onChange={(event) =>
                    setVerdictForm((current) => ({ ...current, summary: event.target.value }))
                  }
                  placeholder="Resumo do veredito para constar nos autos."
                  value={verdictForm.summary}
                />
              </Field>
              <Button disabled={actionBusy} type="submit">
                Registrar veredito
              </Button>
            </Panel>
          ) : null}

          {tratto.status === 'compliance' && canComplete ? (
            <Panel
              bodyClassName="stack"
              subtitle="Consequência cumprida. Arquive o trato para constrangimentos futuros."
              title="Encerrar trato"
            >
              <div className="button-row button-row--stack-mobile">
                <Button disabled={actionBusy} onClick={markComplete} type="button">
                  Marcar como cumprido
                </Button>
              </div>
            </Panel>
          ) : null}
        </aside>
      </PageContainer>
    </AppLayout>
  )
}
