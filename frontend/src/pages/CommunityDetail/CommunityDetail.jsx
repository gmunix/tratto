import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AsyncContent } from '@components/common/AsyncContent'
import { describeApiError } from '@utils/describeApiError'
import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { TrattoCard } from '@components/features/trattos/TrattoCard'
import { decideCommunityRequest, getCommunity, getTrattos, joinCommunity } from '@/services/backend'

export function CommunityDetail() {
  const { communitySlug } = useParams()
  const [communityData, setCommunityData] = useState(null)
  const [communityTrattos, setCommunityTrattos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const loadCommunity = useCallback(async () => {
    try {
      const [communityResponse, trattosResponse] = await Promise.all([
        getCommunity(communitySlug),
        getTrattos({ communitySlug }),
      ])
      setCommunityData(communityResponse)
      setCommunityTrattos(trattosResponse.trattos)
      setError('')
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível carregar a comunidade.'))
      setCommunityData(null)
    } finally {
      setLoading(false)
    }
  }, [communitySlug])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCommunity()
  }, [loadCommunity])

  function retryLoad() {
    setLoading(true)
    setError('')
    loadCommunity()
  }

  async function requestJoin() {
    setActionError('')
    try {
      await joinCommunity(communitySlug)
      loadCommunity()
    } catch (apiError) {
      setActionError(describeApiError(apiError, 'Não foi possível entrar na comunidade.'))
    }
  }

  async function decideRequest(requestId, decision) {
    setActionError('')
    try {
      await decideCommunityRequest(communitySlug, requestId, decision)
      loadCommunity()
    } catch (apiError) {
      setActionError(describeApiError(apiError, 'Não foi possível decidir a solicitação.'))
    }
  }

  const community = communityData?.community

  return (
    <AppLayout backTo="/comunidades" title={community?.name ?? 'Comunidade'}>
      <PageContainer className="page-grid">
        <AsyncContent error={error} loading={loading} onRetry={retryLoad}>
          {community ? (
            <CommunityBody
              actionError={actionError}
              communityData={communityData}
              communityTrattos={communityTrattos}
              onDecideRequest={decideRequest}
              onJoin={requestJoin}
            />
          ) : (
            <EmptyState>Este grupo ainda não foi reconhecido pelo cartório social.</EmptyState>
          )}
        </AsyncContent>
      </PageContainer>
    </AppLayout>
  )
}

function CommunityBody({
  actionError,
  communityData,
  communityTrattos,
  onDecideRequest,
  onJoin,
}) {
  const community = communityData.community
  const currentMembership = community.currentUserMembership
  const canManage = ['creator', 'admin'].includes(currentMembership?.role)
  const isMember = currentMembership?.status === 'member'
  const members = communityData.members ?? []
  const pendingRequests = communityData.pendingRequests ?? []

  return (
    <>
      <div className="stack stack--large">
        <Panel
          actions={<Button to={`/novo?community=${community.slug}`}>Criar trato aqui</Button>}
          bodyClassName="stack"
          subtitle={community.description}
          title={community.name}
          titleAs="h1"
        >
          <div className="community-card__meta">
            <span>/{community.slug}</span>
            <span>{community.privacy === 'public' ? 'Pública' : 'Privada'}</span>
            <span>{community.memberCount} membros</span>
          </div>
        </Panel>

        <Panel title="Tratos da comunidade">
          <div className="stack">
            {communityTrattos.length ? (
              communityTrattos.map((tratto) => <TrattoCard key={tratto.id} tratto={tratto} />)
            ) : (
              <EmptyState>Nenhum trato comunitário protocolado ainda.</EmptyState>
            )}
          </div>
        </Panel>
      </div>

      <aside className="stack stack--large">
        <Panel bodyClassName="stack" title="Participantes">
          {members.length ? (
            members.map((member) => (
              <div className="profile-badge" key={member.id ?? member.user?.id}>
                <p className="profile-badge__name">{member.user?.displayName ?? 'Membro'}</p>
                <p className="case-card__description">@{member.user?.slug ?? 'usuario'} / {member.role}</p>
              </div>
            ))
          ) : (
            <EmptyState>Sem participantes listados.</EmptyState>
          )}
        </Panel>

        {actionError ? <p className="pixel-feedback">{actionError}</p> : null}

        <Panel bodyClassName="stack" title="Ações">
          {isMember ? (
            <p className="notice">
              Você já participa como {getRoleLabel(currentMembership.role)}. Tratos criados aqui ficam ligados à comunidade.
            </p>
          ) : community.privacy === 'public' ? (
            <Button onClick={onJoin} type="button" variant="secondary">Entrar na comunidade</Button>
          ) : (
            <Button onClick={onJoin} type="button" variant="secondary">Solicitar acesso</Button>
          )}
        </Panel>

        {canManage && pendingRequests.length ? (
          <Panel bodyClassName="stack" title="Pedidos pendentes">
            {pendingRequests.map((request) => (
              <div className="profile-badge" key={request.id}>
                <p className="profile-badge__name">{request.user.displayName}</p>
                <p className="case-card__description">@{request.user.slug}</p>
                <div className="button-row">
                  <Button onClick={() => onDecideRequest(request.id, 'approve')} type="button">Aprovar</Button>
                  <Button onClick={() => onDecideRequest(request.id, 'deny')} type="button" variant="ghost">Negar</Button>
                </div>
              </div>
            ))}
          </Panel>
        ) : null}
      </aside>
    </>
  )
}

function getRoleLabel(role) {
  const roleLabels = {
    admin: 'administrador',
    creator: 'criador',
    member: 'membro',
  }

  return roleLabels[role] ?? 'membro'
}
