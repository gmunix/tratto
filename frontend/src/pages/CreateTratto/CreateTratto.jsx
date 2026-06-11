import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { Field } from '@components/common/Field'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { decisionMethodLabels, getCommunityBySlugOrId, trattoCategories } from '@/data/mockTrattos'
import { createTratto, getCommunity, searchUsers } from '@/services/backend'
import { getSession } from '@/services/session'

const initialForm = {
  title: '',
  description: '',
  category: trattoCategories[0].name,
  participantQuery: '',
  participants: [],
  rules: [''],
  deadline: '',
  consequence: '',
  decisionMethod: 'mutual',
  judge: '',
  judgeResolved: null,
}

function createProtocol() {
  return `TRT-${Math.floor(Math.random() * 9000) + 1000}`
}

export function CreateTratto() {
  const [searchParams] = useSearchParams()
  const fallbackCommunity = getCommunityBySlugOrId(searchParams.get('community'))
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [protocol, setProtocol] = useState(createProtocol)
  const [createdTratto, setCreatedTratto] = useState(null)
  const [apiCommunity, setApiCommunity] = useState(null)
  const [error, setError] = useState('')
  const [participantSuggestions, setParticipantSuggestions] = useState([])
  const [judgeSuggestions, setJudgeSuggestions] = useState([])
  const selectedCommunity = apiCommunity ?? fallbackCommunity

  useEffect(() => {
    const community = searchParams.get('community')

    if (!community || !getSession().token) {
      return
    }

    getCommunity(community)
      .then((data) => setApiCommunity(data.community))
      .catch(() => setApiCommunity(null))
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (cancelled) {
        return
      }

      const query = form.participantQuery.trim()

      if (query.length < 2 || !getSession().token) {
        setParticipantSuggestions([])
        return
      }

      searchUsers(query)
        .then((users) => {
          if (!cancelled) {
            setParticipantSuggestions(users)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setParticipantSuggestions([])
          }
        })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [form.participantQuery])

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (cancelled) {
        return
      }

      const query = form.judge.trim()
      const shouldClear =
        form.decisionMethod !== 'judge' ||
        query.length < 2 ||
        !getSession().token ||
        (form.judgeResolved && form.judgeResolved.displayName === query)

      if (shouldClear) {
        setJudgeSuggestions([])
        return
      }

      searchUsers(query)
        .then((users) => {
          if (!cancelled) {
            setJudgeSuggestions(users)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setJudgeSuggestions([])
          }
        })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [form.decisionMethod, form.judge, form.judgeResolved])

  const hasRequiredJudge = form.decisionMethod !== 'judge' || Boolean(form.judgeResolved)
  const canSubmit = Boolean(
    form.title &&
      form.deadline &&
      form.consequence &&
      form.rules.some((rule) => rule.trim()) &&
      form.participants.length > 0 &&
      hasRequiredJudge,
  )
  const selectedCategory = trattoCategories.find((category) => category.name === form.category)

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  function selectParticipant(user) {
    if (form.participants.some((entry) => entry.slug === user.slug)) {
      setForm((currentForm) => ({ ...currentForm, participantQuery: '' }))
      setParticipantSuggestions([])
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      participantQuery: '',
      participants: [...currentForm.participants, { slug: user.slug, displayName: user.displayName }],
    }))
    setParticipantSuggestions([])
  }

  function removeParticipant(slug) {
    setForm((currentForm) => ({
      ...currentForm,
      participants: currentForm.participants.filter((entry) => entry.slug !== slug),
    }))
  }

  function selectJudge(user) {
    setForm((currentForm) => ({
      ...currentForm,
      judge: user.displayName,
      judgeResolved: { slug: user.slug, displayName: user.displayName },
    }))
    setJudgeSuggestions([])
  }

  function updateRule(index, value) {
    setForm((currentForm) => ({
      ...currentForm,
      rules: currentForm.rules.map((rule, ruleIndex) => (ruleIndex === index ? value : rule)),
    }))
  }

  function addRule() {
    setForm((currentForm) => ({ ...currentForm, rules: [...currentForm.rules, ''] }))
  }

  function removeRule(index) {
    setForm((currentForm) => ({
      ...currentForm,
      rules: currentForm.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (canSubmit) {
      setError('')

      if (getSession().token) {
        try {
          const tratto = await createTratto({
            title: form.title,
            description: form.description,
            category: form.category,
            consequence: form.consequence,
            deadline: form.deadline,
            decisionMethod: form.decisionMethod,
            participantSlugs: form.participants.map((entry) => entry.slug),
            judgeSlug: form.decisionMethod === 'judge' ? form.judgeResolved?.slug : undefined,
            communitySlug: selectedCommunity?.slug,
            rules: form.rules.filter((rule) => rule.trim()),
          })
          setCreatedTratto(tratto)
          setProtocol(tratto.caseNumber)
          setSubmitted(true)
          return
        } catch (apiError) {
          setError(apiError.response?.data?.message ?? 'A API recusou o protocolo. Revise slugs e regras.')
          return
        }
      }

      setProtocol(createProtocol())
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <AppLayout backTo="/dashboard" title="Trato registrado">
        <PageContainer className="page-container--center">
          <Panel
            bodyClassName="stack stack--large"
            className="panel--narrow"
            subtitle={
              selectedCommunity
                ? `O trato foi vinculado à comunidade /${selectedCommunity.slug}. Participantes serão notificados.`
                : 'O trato foi enviado ao cartório social. Participantes serão notificados.'
            }
            title={`Protocolo ${protocol}`}
            titleAs="p"
          >
            <h1 className="case-card__title">{createdTratto?.title ?? form.title}</h1>

            <p className="notice">
              Estimativa oficial: dano à amizade moderado. Valor jurídico:
              nenhum. Valor no grupo: altíssimo.
            </p>

            {selectedCommunity ? (
              <p className="notice">
                Comunidade vinculada: {selectedCommunity.name}.
              </p>
            ) : null}

            <div className="button-row button-row--stack-mobile">
              <Button to={selectedCommunity ? `/comunidades/${selectedCommunity.slug}` : '/dashboard'}>
                {selectedCommunity ? 'Voltar à comunidade' : 'Voltar ao painel'}
              </Button>
              <Button
                onClick={() => {
                  setForm(initialForm)
                  setProtocol(createProtocol())
                  setSubmitted(false)
                }}
                type="button"
                variant="secondary"
              >
                Registrar outro
              </Button>
            </div>
          </Panel>
        </PageContainer>
      </AppLayout>
    )
  }

  return (
    <AppLayout backTo="/dashboard" title="Registrar novo trato">
      <PageContainer className="page-container--center">
        <Panel
          as="form"
          bodyClassName="form-grid"
          className="panel--form"
          onSubmit={handleSubmit}
          subtitle="Preencha o suficiente para impedir versões alternativas da verdade."
          title="Formulário TRT-A1"
          titleAs="h1"
        >
            {selectedCommunity ? (
              <div className="notice">
                Comunidade selecionada: {selectedCommunity.name} /{selectedCommunity.slug}.
              </div>
            ) : null}

            <Field htmlFor="tratto-category" label="Categoria">
              <select
                className="select"
                id="tratto-category"
                onChange={(event) => updateField('category', event.target.value)}
                value={form.category}
              >
                {trattoCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="field__hint">{selectedCategory?.description}</p>
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

            <Field
              hint="Busque por nome ou slug"
              htmlFor="tratto-participant"
              label="Participantes"
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  autoComplete="off"
                  className="input"
                  id="tratto-participant"
                  onChange={(event) => updateField('participantQuery', event.target.value)}
                  placeholder="Digite ao menos 2 letras (nome ou slug)"
                  value={form.participantQuery}
                />

                {participantSuggestions.length ? (
                  <ul className="suggestion-list">
                    {participantSuggestions.map((user) => (
                      <li key={user.id}>
                        <button
                          className="suggestion-list__item"
                          onClick={() => selectParticipant(user)}
                          type="button"
                        >
                          <strong>{user.displayName}</strong> <span className="muted-label">@{user.slug}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {form.participants.length ? (
                  <div className="chip-row">
                    {form.participants.map((participant) => (
                      <span className="chip" key={participant.slug}>
                        <span className="chip__text">
                          {participant.displayName} <span className="muted-label">@{participant.slug}</span>
                        </span>
                        <button onClick={() => removeParticipant(participant.slug)} type="button">
                          remover
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Field>

            <Field label="Regras combinadas">
              <div className="rule-list">
                {form.rules.map((rule, index) => (
                  <div className="rule-row" key={`rule-${index + 1}`}>
                    <span className="rule-row__number">{index + 1}</span>
                    <input
                      className="input"
                      onChange={(event) => updateRule(index, event.target.value)}
                      placeholder="Regra objetiva, sem brecha para recurso emocional"
                      value={rule}
                    />
                    <Button
                      disabled={form.rules.length === 1}
                      onClick={() => removeRule(index)}
                      type="button"
                      variant="ghost"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Button onClick={addRule} type="button" variant="secondary">
                  Adicionar regra
                </Button>
              </div>
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
              <Field
                hint={form.judgeResolved ? `Selecionado: @${form.judgeResolved.slug}` : 'Busque pelo nome ou slug'}
                htmlFor="tratto-judge"
                label="Juiz escolhido"
              >
                <input
                  autoComplete="off"
                  className="input"
                  id="tratto-judge"
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      judge: event.target.value,
                      judgeResolved: null,
                    }))
                  }
                  placeholder="Digite ao menos 2 letras"
                  value={form.judge}
                />
                {judgeSuggestions.length ? (
                  <ul className="suggestion-list">
                    {judgeSuggestions.map((user) => (
                      <li key={user.id}>
                        <button
                          className="suggestion-list__item"
                          onClick={() => selectJudge(user)}
                          type="button"
                        >
                          <strong>{user.displayName}</strong> <span className="muted-label">@{user.slug}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Field>
            ) : null}

            <p className="notice">
              Aviso: ao registrar, todos reconhecem que este trato não tem valor
              legal, mas poderá ser usado em conversas futuras com alto grau de
              inconveniência.
            </p>

            <Button disabled={!canSubmit} fullWidth type="submit">
              Registrar trato
            </Button>
            {error ? <p className="pixel-feedback">{error}</p> : null}
        </Panel>
      </PageContainer>
    </AppLayout>
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
