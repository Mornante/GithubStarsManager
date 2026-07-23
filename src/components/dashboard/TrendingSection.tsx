import { useCallback, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useTrendingStore } from '../../store/trendingStore'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import type { Repo } from '../../types/github'
import type { TrendingWindow } from '../../utils/dateWindows'
import Loader from '../shared/Loader'
import TrendingCard from './TrendingCard'

const WINDOW_OPTIONS: { value: TrendingWindow; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

export default function TrendingSection({
  repos,
  onOpenRepo,
}: {
  repos: Repo[]
  onOpenRepo: (nameWithOwner: string) => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const { results, language, window, status, error, hasMore, setLanguage, setWindow, fetch, fetchMore } =
    useTrendingStore()

  const starredKeys = useMemo(() => new Set(repos.map((r) => r.nameWithOwner.toLowerCase())), [repos])
  const languages = useMemo(() => {
    const set = new Set<string>()
    for (const r of repos) if (r.primaryLanguage) set.add(r.primaryLanguage.name)
    return Array.from(set).sort()
  }, [repos])

  useEffect(() => {
    if (account) void fetch(account.token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, language, window])

  const loadMore = useCallback(() => {
    if (account) void fetchMore(account.token)
  }, [account, fetchMore])

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore && status !== 'error')

  const notYetStarred = results.filter((r) => !starredKeys.has(r.full_name.toLowerCase()))

  if (!account) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Trending, not yet starred</h2>
        <div className="flex items-center gap-2">
          <select
            value={language ?? ''}
            onChange={(e) => setLanguage(e.target.value || null)}
            className="text-sm border border-border-default rounded-md bg-canvas px-2 py-1"
          >
            <option value="">All languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-border-default overflow-hidden">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWindow(opt.value)}
                className={`px-3 py-1 text-sm ${
                  window === opt.value ? 'bg-accent-emphasis text-white' : 'bg-canvas hover:bg-canvas-subtle'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === 'loading' && <Loader label="Loading trending repos…" />}
      {status === 'error' && <p className="text-sm text-danger-fg">{error}</p>}
      {status !== 'loading' && notYetStarred.length === 0 && (
        <p className="text-sm text-fg-muted">No unstarred trending repos found for this filter.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notYetStarred.map((repo) => (
          <TrendingCard key={repo.id} repo={repo} onOpen={() => onOpenRepo(repo.full_name)} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center text-sm">
          {status === 'loadingMore' ? (
            <Loader label="Loading more…" size="sm" />
          ) : (
            <button type="button" onClick={loadMore} className="text-fg-muted hover:text-fg-default underline">
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  )
}
