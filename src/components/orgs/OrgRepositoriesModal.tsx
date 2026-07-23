import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Organization, Repo, StarList } from '../../types/github'
import { useAuthStore } from '../../store/authStore'
import { fetchOrgRepositories } from '../../api/orgsApi'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import RepoGrid from '../repos/RepoGrid'
import RepoDetailModal from '../repos/RepoDetailModal'

export default function OrgRepositoriesModal({
  org,
  starredRepos,
  lists,
  onClose,
}: {
  org: Organization
  starredRepos: Repo[]
  lists: StarList[]
  onClose: () => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const [repos, setRepos] = useState<Repo[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<'loading' | 'loadingMore' | 'idle' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [openRepoKey, setOpenRepoKey] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return
    let cancelled = false
    setStatus('loading')
    fetchOrgRepositories(account.token, org.login)
      .then((result) => {
        if (cancelled) return
        setRepos(result.repos)
        setTotalCount(result.totalCount)
        setCursor(result.endCursor)
        setHasMore(result.hasNextPage)
        setStatus('idle')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load repositories')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, org.login])

  const loadMore = useCallback(() => {
    if (!account || status === 'loading' || status === 'loadingMore' || !hasMore) return
    setStatus('loadingMore')
    fetchOrgRepositories(account.token, org.login, cursor)
      .then((result) => {
        setRepos((prev) => [...prev, ...result.repos])
        setCursor(result.endCursor)
        setHasMore(result.hasNextPage)
        setStatus('idle')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load more repositories')
        setStatus('error')
      })
  }, [account, org.login, cursor, hasMore, status])

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  // Prefer the viewer's own starred copy (real listIds) when this org repo is already starred.
  const mergedRepos = useMemo(() => {
    const starredByName = new Map(starredRepos.map((r) => [r.nameWithOwner.toLowerCase(), r]))
    return repos.map((r) => starredByName.get(r.nameWithOwner.toLowerCase()) ?? r)
  }, [repos, starredRepos])

  return (
    <>
      {!openRepoKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-md border border-border-default bg-canvas flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border-default p-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{org.login} — repositories</h3>
                {totalCount !== null && (
                  <p className="text-xs text-fg-muted">{totalCount.toLocaleString()} public repos</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-fg-muted hover:text-fg-default text-xl leading-none px-1"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {status === 'error' && <p className="text-sm text-danger-fg">{error}</p>}
              {status === 'loading' && repos.length === 0 ? (
                <p className="text-sm text-fg-muted py-8 text-center">Loading repositories…</p>
              ) : (
                <>
                  <RepoGrid
                    repos={mergedRepos}
                    lists={lists}
                    view="grid"
                    onOpenRepo={(nameWithOwner) => setOpenRepoKey(nameWithOwner)}
                  />
                  {repos.length > 0 && (
                    <div ref={sentinelRef} className="py-4 text-center text-sm">
                      {status === 'loadingMore' ? (
                        <span className="text-fg-muted">Loading more…</span>
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
              )}
            </div>
          </div>
        </div>
      )}

      {openRepoKey && (
        <RepoDetailModal
          nameWithOwner={openRepoKey}
          repos={mergedRepos}
          lists={lists}
          onClose={() => setOpenRepoKey(null)}
        />
      )}
    </>
  )
}
