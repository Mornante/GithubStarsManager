import { fetchRepoIssues } from '../../api/repoApi'
import { useAuthStore } from '../../store/authStore'
import { issueHasChangedSinceView, useIssueViewsStore } from '../../store/issueViewsStore'
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import type { Issue } from '../../api/issuesApi'
import IssueRow from '../issues/IssueRow'
import Loader from '../shared/Loader'

export default function RepoIssuesTab({
  token,
  owner,
  name,
}: {
  token: string
  owner: string
  name: string
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const markViewed = useIssueViewsStore((s) => s.markViewed)
  const viewsByUser = useIssueViewsStore((s) => s.byUser)

  const {
    items: issues,
    status,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<Issue>(
    async (cursor) => {
      const result = await fetchRepoIssues(token, owner, name, cursor)
      return { items: result.issues, hasNextPage: result.hasNextPage, endCursor: result.endCursor }
    },
    [token, owner, name],
  )

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  if (status === 'error') return <p className="text-sm text-danger-fg">{error}</p>

  if (status === 'loading' && issues.length === 0) {
    return (
      <div className="py-8 text-center">
        <Loader label="Loading issues…" />
      </div>
    )
  }

  if (issues.length === 0) {
    return <p className="text-sm text-fg-muted py-8 text-center">No issues found.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {issues.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            hasChanges={
              account
                ? issueHasChangedSinceView(viewsByUser, account.user.id, issue.id, issue.updatedAt)
                : false
            }
            onOpen={() => account && markViewed(account.user.id, issue.id, issue.updatedAt)}
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
          <span className="text-fg-muted">Showing all {issues.length}</span>
        )}
      </div>
    </>
  )
}
