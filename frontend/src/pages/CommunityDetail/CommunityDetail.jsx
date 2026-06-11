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

export function CommunityDetail() {
  const { communitySlug } = useParams()
  const community = getCommunityBySlug(communitySlug)

  if (!community) {
    return (
      <AppLayout backTo="/comunidades" title="Comunidade não encontrada">
        <PageContainer>
          <EmptyState>Este grupo ainda não foi reconhecido pelo cartório social.</EmptyState>
        </PageContainer>
      </AppLayout>
    )
  }

  const communityTrattos = getCommunityTrattos(community.id)
  const currentMembership = community.members.find((member) => member.userId === currentUser.id)
  const canManage = ['creator', 'admin'].includes(currentMembership?.role)
  const isMember = currentMembership?.status === 'member'

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
            {community.members.map((member) => {
              const user = getUserById(member.userId)

              return (
                <div className="profile-badge" key={member.userId}>
                  <p className="profile-badge__name">{user?.name ?? member.userId}</p>
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
              <Button type="button" variant="secondary">Entrar na comunidade</Button>
            ) : (
              <Button type="button" variant="secondary">Solicitar acesso</Button>
            )}
            {canManage ? <Button type="button" variant="ghost">Gerenciar participantes</Button> : null}
            {canManage ? <Button type="button" variant="ghost">Editar comunidade</Button> : null}
          </Panel>
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
