import { useMemo } from 'react'
import type { Repo, StarList } from '../../types/github'
import { fetchOrgRepositories } from '../../api/orgsApi'
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import RepoGrid from '../repos/RepoGrid'
import Loader from '../shared/Loader'

export default function OrgRepositoriesTab({
  token,
  login,
  starredRepos,
  lists,
  onOpenRepo,
}: {
  token: string
  login: string
  starredRepos: Repo[]
  lists: StarList[]
  onOpenRepo: (nameWithOwner: string) => void
}) {
  const {
    items: repos,
    status,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<Repo>(
    async (cursor) => {
      const result = await fetchOrgRepositories(token, login, cursor)
      return { items: result.repos, hasNextPage: result.hasNextPage, endCursor: result.endCursor }
    },
    [token, login],
  )

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  // Prefer the viewer's own starred copy (real listIds) when this org repo is already starred.
  const mergedRepos = useMemo(() => {
    const starredByName = new Map(starredRepos.map((r) => [r.nameWithOwner.toLowerCase(), r]))
    return repos.map((r) => starredByName.get(r.nameWithOwner.toLowerCase()) ?? r)
  }, [repos, starredRepos])

  if (status === 'error') return <p className="text-sm text-danger-fg">{error}</p>

  if (status === 'loading' && repos.length === 0) {
    return (
      <div className="py-8 text-center">
        <Loader label="Loading repositories…" />
      </div>
    )
  }

  return (
    <>
      <RepoGrid repos={mergedRepos} lists={lists} view="grid" onOpenRepo={onOpenRepo} />
      {repos.length > 0 && (
        <div ref={sentinelRef} className="py-4 text-center text-sm">
          {status === 'loadingMore' ? (
            <Loader label="Loading more…" size="sm" />
          ) : hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              className="text-fg-muted hover:text-fg-default underline"
            >
              Load more
            </button>
          ) : (
            <span className="text-fg-muted">Showing all {repos.length}</span>
          )}
        </div>
      )}
    </>
  )
}
