import { useState } from 'react'
import { Link } from 'react-router-dom'

import { AppLayout } from '@components/layout/AppLayout'
import { PageContainer } from '@components/layout/PageContainer'
import { decisionMethodLabels, trattoCategories } from '@/data/mockTrattos'

const initialForm = {
  title: '',
  description: '',
  category: trattoCategories[0],
  participantName: '',
  participants: [],
  rules: '',
  deadline: '',
  consequence: '',
  decisionMethod: 'mutual',
  judge: '',
}

function createProtocol() {
  return `TRT-${Math.floor(Math.random() * 9000) + 1000}`
}

export function CreateTratto() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [protocol, setProtocol] = useState(createProtocol)

  const hasRequiredJudge = form.decisionMethod !== 'judge' || Boolean(form.judge.trim())
  const canSubmit = Boolean(
    form.title &&
      form.deadline &&
      form.consequence &&
      form.participants.length > 0 &&
      hasRequiredJudge,
  )

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  function addParticipant() {
    const participantName = form.participantName.trim()

    if (!participantName || form.participants.includes(participantName)) {
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      participantName: '',
      participants: [...currentForm.participants, participantName],
    }))
  }

  function removeParticipant(participantName) {
    setForm((currentForm) => ({
      ...currentForm,
      participants: currentForm.participants.filter((name) => name !== participantName),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (canSubmit) {
      setProtocol(createProtocol())
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <AppLayout backTo="/dashboard" title="Trato registrado">
        <PageContainer>
          <section className="panel" style={{ maxWidth: 680 }}>
            <div className="panel__body stack stack--large">
              <div>
                <p className="section-title">Protocolo {protocol}</p>
                <h1 className="case-card__title" style={{ marginTop: 8 }}>
                  {form.title}
                </h1>
                <p className="section-subtitle">
                  O trato foi enviado ao cartório social. Participantes serão
                  notificados assim que o backend existir.
                </p>
              </div>

              <p className="notice">
                Estimativa oficial: dano à amizade moderado. Valor jurídico:
                nenhum. Valor no grupo: altíssimo.
              </p>

              <div className="button-row button-row--stack-mobile">
                <Link className="button button--primary" to="/dashboard">
                  Voltar ao painel
                </Link>
                <button
                  className="button button--secondary"
                  onClick={() => {
                    setForm(initialForm)
                    setProtocol(createProtocol())
                    setSubmitted(false)
                  }}
                  type="button"
                >
                  Registrar outro
                </button>
              </div>
            </div>
          </section>
        </PageContainer>
      </AppLayout>
    )
  }

  return (
    <AppLayout backTo="/dashboard" title="Registrar novo trato">
      <PageContainer>
        <form className="panel" onSubmit={handleSubmit} style={{ maxWidth: 760 }}>
          <div className="panel__header">
            <div>
              <h1 className="section-title">Formulário TRT-A1</h1>
              <p className="section-subtitle">
                Preencha o suficiente para impedir versões alternativas da verdade.
              </p>
            </div>
          </div>

          <div className="panel__body form-grid">
            <Field htmlFor="tratto-category" label="Categoria">
              <select
                className="select"
                id="tratto-category"
                onChange={(event) => updateField('category', event.target.value)}
                value={form.category}
              >
                {trattoCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field htmlFor="tratto-title" hint="Obrigatório" label="Título do caso">
              <input
                className="input"
                id="tratto-title"
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ex.: João consegue ficar uma semana sem reclamar do café"
                value={form.title}
              />
            </Field>

            <Field htmlFor="tratto-description" label="Descrição dos fatos">
              <textarea
                className="textarea"
                id="tratto-description"
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Contexto, provocação original e qualquer detalhe que possa virar discussão depois."
                value={form.description}
              />
            </Field>

            <Field htmlFor="tratto-participant" hint="Obrigatório" label="Participantes">
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="participant-input-row">
                  <input
                    className="input"
                    id="tratto-participant"
                    onChange={(event) => updateField('participantName', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addParticipant()
                      }
                    }}
                    placeholder="Nome ou usuário"
                    value={form.participantName}
                  />
                  <button className="button button--secondary" onClick={addParticipant} type="button">
                    Adicionar
                  </button>
                </div>

                {form.participants.length ? (
                  <div className="chip-row">
                    {form.participants.map((participant) => (
                      <span className="chip" key={participant}>
                        <span className="chip__text">{participant}</span>
                        <button onClick={() => removeParticipant(participant)} type="button">
                          remover
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Field>

            <Field htmlFor="tratto-rules" label="Regras combinadas">
              <textarea
                className="textarea"
                id="tratto-rules"
                onChange={(event) => updateField('rules', event.target.value)}
                placeholder="Liste regras objetivas. Ambiguidade alimenta recurso."
                value={form.rules}
              />
            </Field>

            <Field htmlFor="tratto-deadline" hint="Obrigatório" label="Prazo final">
              <input
                className="input"
                id="tratto-deadline"
                onChange={(event) => updateField('deadline', event.target.value)}
                type="date"
                value={form.deadline}
              />
            </Field>

            <Field htmlFor="tratto-consequence" hint="Obrigatório" label="Consequência ou recompensa">
              <input
                className="input"
                id="tratto-consequence"
                onChange={(event) => updateField('consequence', event.target.value)}
                placeholder="Ex.: perdedor paga café por uma semana"
                value={form.consequence}
              />
            </Field>

            <Field label="Método de decisão">
              <div className="option-grid">
                {Object.entries(decisionMethodLabels).map(([method, label]) => (
                  <button
                    aria-pressed={form.decisionMethod === method}
                    className={`option-card${form.decisionMethod === method ? ' is-selected' : ''}`}
                    key={method}
                    onClick={() => updateField('decisionMethod', method)}
                    type="button"
                  >
                    <span className="section-title">{label}</span>
                    <p className="section-subtitle">
                      {getDecisionDescription(method)}
                    </p>
                  </button>
                ))}
              </div>
            </Field>

            {form.decisionMethod === 'judge' ? (
              <Field htmlFor="tratto-judge" hint="Obrigatório para este método" label="Juiz escolhido">
                <input
                  className="input"
                  id="tratto-judge"
                  onChange={(event) => updateField('judge', event.target.value)}
                  placeholder="Nome da pessoa que vai decidir"
                  value={form.judge}
                />
              </Field>
            ) : null}

            <p className="notice">
              Aviso: ao registrar, todos reconhecem que este trato não tem valor
              legal, mas poderá ser usado em conversas futuras com alto grau de
              inconveniência.
            </p>

            <button className="button button--primary button--full" disabled={!canSubmit} type="submit">
              Registrar trato
            </button>
          </div>
        </form>
      </PageContainer>
    </AppLayout>
  )
}

function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="field">
      {htmlFor ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="field__label">{label}</span>
      )}
      {hint ? <span className="field__hint">{hint}</span> : null}
      {children}
    </div>
  )
}

function getDecisionDescription(method) {
  const descriptions = {
    mutual: 'As partes confirmam juntas o resultado, idealmente sem teatro.',
    vote: 'O grupo vota e a maioria assume a responsabilidade moral.',
    judge: 'Uma pessoa escolhida decide o veredito e aguenta a pressão social.',
  }

  return descriptions[method]
}
