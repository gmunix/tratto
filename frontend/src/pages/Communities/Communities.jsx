import { useState } from 'react'

import { Button } from '@components/common/Button'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { currentUser, mockCommunities } from '@/data/mockTrattos'

export function Communities() {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const userCommunities = mockCommunities.filter((community) =>
    community.members.some((member) => member.userId === currentUser.id && member.status === 'member'),
  )
  const discoveryCommunities = mockCommunities.filter((community) => {
    const matchesQuery = `${community.name} ${community.slug}`.toLowerCase().includes(normalizedQuery)

    return matchesQuery && !userCommunities.some((userCommunity) => userCommunity.id === community.id)
  })

  return (
    <AppLayout title="Comunidades">
      <PageContainer className="stack stack--large">
        <Panel
          bodyClassName="form-grid"
          subtitle="Encontre grupos onde tratos coletivos viram jurisprudência local."
          title="Buscar comunidade"
          titleAs="h1"
        >
          <input
            className="input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome ou slug, ex.: republica-404"
            value={query}
          />
        </Panel>

        <CommunitySection communities={userCommunities} title="Minhas comunidades" />
        <CommunitySection communities={discoveryCommunities} title="Descoberta" />
      </PageContainer>
    </AppLayout>
  )
}

function CommunitySection({ communities, title }) {
  return (
    <Panel title={title}>
      <div className="community-grid">
        {communities.map((community) => (
          <article className="community-card" key={community.id}>
            <span className="muted-label">/{community.slug}</span>
            <h2 className="case-card__title">{community.name}</h2>
            <p className="case-card__description">{community.description}</p>
            <div className="community-card__meta">
              <span>{community.privacy === 'public' ? 'Pública' : 'Privada'}</span>
              <span>{community.memberCount} membros</span>
              <span>{community.activeTrattos} ativos</span>
            </div>
            <Button to={`/comunidades/${community.slug}`} variant="secondary">
              Abrir comunidade
            </Button>
          </article>
        ))}
      </div>
    </Panel>
  )
}
