import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { TrattoCard } from '@components/features/trattos/TrattoCard'
import {
  currentUser,
  getCommunityBySlug,
  getCommunityTrattos,
  getUserById,
} from '@/data/mockTrattos'
import { decideCommunityRequest, getCommunity, getTrattos, joinCommunity } from '@/services/backend'
import { getSession } from '@/services/session'

export function CommunityDetail() {
  const { communitySlug } = useParams()
  const [communityData, setCommunityData] = useState(null)
  const [communityTrattos, setCommunityTrattos] = useState([])
  const [source, setSource] = useState('mock')
  const fallbackCommunity = getCommunityBySlug(communitySlug)
  const community = communityData?.community ?? fallbackCommunity
  const fallbackTrattos = fallbackCommunity ? getCommunityTrattos(fallbackCommunity.id) : []

  useEffect(() => {
    if (!getSession().token) {
      return
    }

    Promise.all([getCommunity(communitySlug), getTrattos({ communitySlug })])
      .then(([communityResponse, trattosResponse]) => {
        setCommunityData(communityResponse)
        setCommunityTrattos(trattosResponse.trattos)
        setSource('api')
      })
      .catch(() => {
        setSource('mock')
      })
  }, [communitySlug, fallbackCommunity])

  if (!community) {
    return (
      <AppLayout backTo="/comunidades" title="Comunidade não encontrada">
        <PageContainer>
          <EmptyState>Este grupo ainda não foi reconhecido pelo cartório social.</EmptyState>
        </PageContainer>
      </AppLayout>
    )
  }

  const visibleCommunityTrattos = source === 'api' ? communityTrattos : fallbackTrattos
  const currentMembership = source === 'api'
    ? community.currentUserMembership
    : community.members.find((member) => member.userId === currentUser.id)
  const canManage = ['creator', 'admin'].includes(currentMembership?.role)
  const isMember = currentMembership?.status === 'member'
  const members = source === 'api' ? communityData.members : community.members
  const pendingRequests = source === 'api' ? communityData.pendingRequests : []

  async function requestJoin() {
    await joinCommunity(community.slug)
    const refreshed = await getCommunity(community.slug)
    setCommunityData(refreshed)
    setSource('api')
  }

  async function decideRequest(requestId, decision) {
    await decideCommunityRequest(community.slug, requestId, decision)
    const refreshed = await getCommunity(community.slug)
    setCommunityData(refreshed)
  }

  return (
    <AppLayout backTo="/comunidades" title={community.name}>
      <PageContainer className="page-grid">
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
              {visibleCommunityTrattos.length ? (
                visibleCommunityTrattos.map((tratto) => <TrattoCard key={tratto.id} tratto={tratto} />)
              ) : (
                <EmptyState>Nenhum trato comunitário protocolado ainda.</EmptyState>
              )}
            </div>
          </Panel>
        </div>

        <aside className="stack stack--large">
          <Panel bodyClassName="stack" title="Participantes">
            {members.map((member) => {
              const user = source === 'api' ? member.user : getUserById(member.userId)

              return (
                <div className="profile-badge" key={member.id ?? member.userId}>
                  <p className="profile-badge__name">{user?.displayName ?? user?.name ?? member.userId}</p>
                  <p className="case-card__description">@{user?.slug ?? 'usuario'} / {member.role}</p>
                </div>
              )
            })}
          </Panel>

          <Panel bodyClassName="stack" title="Ações">
            {isMember ? (
              <p className="notice">
                Você já participa como {getRoleLabel(currentMembership.role)}. Tratos criados aqui ficam ligados à comunidade.
              </p>
            ) : community.privacy === 'public' ? (
              <Button onClick={requestJoin} type="button" variant="secondary">Entrar na comunidade</Button>
            ) : (
              <Button onClick={requestJoin} type="button" variant="secondary">Solicitar acesso</Button>
            )}
            {canManage ? <Button type="button" variant="ghost">Gerenciar participantes</Button> : null}
            {canManage ? <Button type="button" variant="ghost">Editar comunidade</Button> : null}
          </Panel>
          {canManage && pendingRequests.length ? (
            <Panel bodyClassName="stack" title="Pedidos pendentes">
              {pendingRequests.map((request) => (
                <div className="profile-badge" key={request.id}>
                  <p className="profile-badge__name">{request.user.displayName}</p>
                  <p className="case-card__description">@{request.user.slug}</p>
                  <div className="button-row">
                    <Button onClick={() => decideRequest(request.id, 'approve')} type="button">Aprovar</Button>
                    <Button onClick={() => decideRequest(request.id, 'deny')} type="button" variant="ghost">Negar</Button>
                  </div>
                </div>
              ))}
            </Panel>
          ) : null}
        </aside>
      </PageContainer>
    </AppLayout>
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
