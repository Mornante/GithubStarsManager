import { fetchRepoPullRequests } from '../../api/repoApi'
import { useAuthStore } from '../../store/authStore'
import { issueHasChangedSinceView, useIssueViewsStore } from '../../store/issueViewsStore'
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import type { RepoPullRequest } from '../../types/github'
import PullRequestRow from './PullRequestRow'
import Loader from '../shared/Loader'

export default function RepoPullRequestsTab({ token, owner, name }: { token: string; owner: string; name: string }) {
  const account = useAuthStore((s) => s.currentAccount())
  const markViewed = useIssueViewsStore((s) => s.markViewed)
  const viewsByUser = useIssueViewsStore((s) => s.byUser)

  const {
    items: pullRequests,
    status,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<RepoPullRequest>(async (cursor) => {
    const result = await fetchRepoPullRequests(token, owner, name, cursor)
    return { items: result.pullRequests, hasNextPage: result.hasNextPage, endCursor: result.endCursor }
  }, [token, owner, name])

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  if (status === 'error') return <p className="text-sm text-danger-fg">{error}</p>

  if (status === 'loading' && pullRequests.length === 0) {
    return (
      <div className="py-8 text-center">
        <Loader label="Loading pull requests…" />
      </div>
    )
  }

  if (pullRequests.length === 0) {
    return <p className="text-sm text-fg-muted py-8 text-center">No pull requests found.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {pullRequests.map((pr) => (
          <PullRequestRow
            key={pr.id}
            pullRequest={pr}
            hasChanges={account ? issueHasChangedSinceView(viewsByUser, account.user.id, pr.id, pr.updatedAt) : false}
            onOpen={() => account && markViewed(account.user.id, pr.id, pr.updatedAt)}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="py-4 text-center text-sm">
        {status === 'loadingMore' ? (
          <Loader label="Loading more…" size="sm" />
        ) : hasMore ? (
          <button type="button" onClick={loadMore} className="text-fg-muted hover:text-fg-default underline">
            Load more
          </button>
        ) : (
          <span className="text-fg-muted">Showing all {pullRequests.length}</span>
        )}
      </div>
    </>
  )
}
