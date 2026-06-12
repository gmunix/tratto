import { useCallback, useEffect, useState } from 'react'

import { AsyncContent } from '@components/common/AsyncContent'
import { describeApiError } from '@utils/describeApiError'
import { Button } from '@components/common/Button'
import { EmptyState } from '@components/common/EmptyState'
import { AppLayout } from '@components/layout/AppLayout'
import { Panel } from '@components/layout/Panel'
import { PageContainer } from '@components/layout/PageContainer'
import { getCommunities } from '@/services/backend'

export function Communities() {
  const [query, setQuery] = useState('')
  const [userCommunities, setUserCommunities] = useState([])
  const [discoveryCommunities, setDiscoveryCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCommunities = useCallback(async (searchQuery) => {
    try {
      const data = await getCommunities(searchQuery)
      setUserCommunities(data.myCommunities)
      setDiscoveryCommunities(
        data.communities.filter(
          (community) => !data.myCommunities.some((userCommunity) => userCommunity.id === community.id),
        ),
      )
      setError('')
    } catch (apiError) {
      setError(describeApiError(apiError, 'Não foi possível carregar comunidades.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCommunities(query)
  }, [loadCommunities, query])

  function retryLoad() {
    setLoading(true)
    setError('')
    loadCommunities(query)
  }

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

        <AsyncContent error={error} loading={loading} onRetry={retryLoad}>
          <CommunitySection communities={userCommunities} emptyMessage="Você ainda não faz parte de nenhuma comunidade." title="Minhas comunidades" />
          <CommunitySection communities={discoveryCommunities} emptyMessage="Sem comunidades para mostrar." title="Descoberta" />
        </AsyncContent>
      </PageContainer>
    </AppLayout>
  )
}

function CommunitySection({ communities, emptyMessage, title }) {
  return (
    <Panel title={title}>
      {communities.length ? (
        <div className="community-grid">
          {communities.map((community) => (
            <article className="community-card" key={community.id}>
              <span className="muted-label">/{community.slug}</span>
              <h2 className="case-card__title">{community.name}</h2>
              <p className="case-card__description">{community.description}</p>
              <div className="community-card__meta">
                <span>{community.privacy === 'public' ? 'Pública' : 'Privada'}</span>
                <span>{community.memberCount} membros</span>
                <span>{community.activeTrattoCount} ativos</span>
              </div>
              <Button to={`/comunidades/${community.slug}`} variant="secondary">
                Abrir comunidade
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </Panel>
  )
}
