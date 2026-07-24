import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useIssuesStore } from '../store/issuesStore'
import { issueHasChangedSinceView, useIssueViewsStore } from '../store/issueViewsStore'
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel'
import IssueRow from '../components/issues/IssueRow'
import Loader from '../components/shared/Loader'
import { OcticonSearch } from '../components/icons/Octicons'

export default function IssuesPage() {
  const account = useAuthStore((s) => s.currentAccount())
  const { results, status, error, hasMore, setQuery, search, searchMore } = useIssuesStore()
  const markViewed = useIssueViewsStore((s) => s.markViewed)
  const viewsByUser = useIssueViewsStore((s) => s.byUser)

  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (!account) return
    // Debounced either way — an empty query still runs, since involves:@me
    // alone is what powers the default "everything I'm in" listing.
    const handle = setTimeout(() => {
      setQuery(inputValue.trim())
      void search(account.token)
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, account])

  const loadMore = useCallback(() => {
    if (account) void searchMore(account.token)
  }, [account, searchMore])
  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  if (!account) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold">Issues</h1>
        <p className="text-sm text-fg-muted">
          Issues you're involved in — as author, assignee, or mentioned — across all of GitHub.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <OcticonSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search issues…"
            className="w-full pl-10 pr-4 py-2.5 text-lg text-center rounded-full border border-border-default bg-canvas-subtle focus:outline-none focus:ring-2 focus:ring-accent-fg focus:bg-canvas"
          />
        </div>
      </div>

      {status === 'error' && <p className="text-sm text-danger-fg">{error}</p>}
      {status === 'loading' && <Loader label="Loading issues…" />}
      {status !== 'loading' && results.length === 0 && (
        <p className="text-sm text-fg-muted py-8 text-center">No issues found.</p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            hasChanges={issueHasChangedSinceView(viewsByUser, account.user.id, issue.id, issue.updatedAt)}
            onOpen={() => markViewed(account.user.id, issue.id, issue.updatedAt)}
          />
        ))}
      </div>

      {results.length > 0 && (
        <div ref={sentinelRef} className="py-4 text-center text-sm">
          {status === 'loadingMore' ? (
            <Loader label="Loading more…" size="sm" />
          ) : hasMore ? (
            <button type="button" onClick={loadMore} className="text-fg-muted hover:text-fg-default underline">
              Load more
            </button>
          ) : (
            <span className="text-fg-muted">Showing all {results.length}</span>
          )}
        </div>
      )}
    </div>
  )
}
