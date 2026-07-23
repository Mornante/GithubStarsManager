import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStarredRepos } from '../hooks/useStarredRepos'
import { useGsmState } from '../hooks/useGsmState'
import { useSyncedFilters } from '../hooks/useSyncedFilters'
import { useRepoModal } from '../hooks/useRepoModal'
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel'
import { filterRepos, sortRepos } from '../selectors/filterRepos'
import { FILTER_DEFINITIONS } from '../config/filterDefinitions'
import FilterCards from '../components/repos/FilterCards'
import FilterBar from '../components/repos/FilterBar'
import ActiveFilterPills from '../components/repos/ActiveFilterPills'
import RepoGrid from '../components/repos/RepoGrid'
import RepoDetailModal from '../components/repos/RepoDetailModal'
import { OcticonChevronDown } from '../components/icons/Octicons'

const REPOS_PAGE_SIZE = 60

export default function RepoListPage() {
  const { repos, lists, status, error, retry } = useStarredRepos()
  const { reviewTags, deployments, status: gsmStatus, error: gsmError, retry: gsmRetry } = useGsmState()
  const { filterState, setFilter, clearFilter, clearAll, applyPreset, sortKey, setSortKey, view, setView } =
    useSyncedFilters()
  const { openRepoKey, openRepo, closeRepo } = useRepoModal()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const searchDef = FILTER_DEFINITIONS.find((def) => def.kind === 'search')!

  const visibleRepos = useMemo(() => {
    return sortRepos(filterRepos(repos, filterState, { lists, reviewTags, deployments }), sortKey)
  }, [repos, filterState, lists, reviewTags, deployments, sortKey])

  // Renders in pages even though the full starred-repo set is already loaded
  // locally, so a large collection doesn't dump thousands of cards into the DOM at once.
  const [visibleCount, setVisibleCount] = useState(REPOS_PAGE_SIZE)
  useEffect(() => setVisibleCount(REPOS_PAGE_SIZE), [filterState, sortKey])

  const pagedRepos = useMemo(() => visibleRepos.slice(0, visibleCount), [visibleRepos, visibleCount])
  const hasMore = visibleCount < visibleRepos.length
  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + REPOS_PAGE_SIZE, visibleRepos.length))
  }, [visibleRepos.length])
  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  return (
    <div>
      {status === 'error' && (
        <div className="mt-4 rounded-md border border-danger-fg/40 bg-danger-fg/10 px-4 py-3 text-sm text-danger-fg flex items-center justify-between gap-4">
          <span>Failed to sync with GitHub: {error}</span>
          <button
            type="button"
            onClick={retry}
            className="shrink-0 rounded-md border border-danger-fg/40 px-2 py-1 text-xs font-medium hover:bg-danger-fg/10"
          >
            Retry
          </button>
        </div>
      )}

      {gsmStatus === 'error' && (
        <div className="mt-4 rounded-md border border-danger-fg/40 bg-danger-fg/10 px-4 py-3 text-sm text-danger-fg flex items-center justify-between gap-4">
          <span>Failed to sync GSM:STATE gist: {gsmError}</span>
          <button
            type="button"
            onClick={gsmRetry}
            className="shrink-0 rounded-md border border-danger-fg/40 px-2 py-1 text-xs font-medium hover:bg-danger-fg/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border-default bg-canvas p-6 space-y-6">
        <div className="flex justify-center">
          <searchDef.control
            value={filterState[searchDef.key] ?? searchDef.defaultValue}
            options={searchDef.getOptions?.(repos, lists)}
            onChange={(next) => setFilter(searchDef.key, next)}
          />
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">Quick filters</div>
          <FilterCards
            repos={repos}
            lists={lists}
            reviewTags={reviewTags}
            deployments={deployments}
            onApply={applyPreset}
          />
        </div>

        <div className="border-t border-border-default pt-4">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg-default"
          >
            <OcticonChevronDown className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            Filters
          </button>
          {filtersOpen && (
            <div className="pt-4">
              <FilterBar
                repos={repos}
                lists={lists}
                filterState={filterState}
                setFilter={setFilter}
                sortKey={sortKey}
                setSortKey={setSortKey}
                view={view}
                setView={setView}
              />
            </div>
          )}
        </div>

        <ActiveFilterPills
          repos={repos}
          lists={lists}
          filterState={filterState}
          clearFilter={clearFilter}
          clearAll={clearAll}
        />
      </div>

      {status === 'syncing' && repos.length === 0 ? (
        <p className="text-sm text-fg-muted py-8 text-center">Loading your starred repositories…</p>
      ) : (
        <div className="pt-4">
          <RepoGrid
            repos={pagedRepos}
            lists={lists}
            reviewTags={reviewTags}
            deployments={deployments}
            view={view}
            onOpenRepo={openRepo}
          />

          {visibleRepos.length > 0 && (
            <div ref={sentinelRef} className="py-6 text-center text-sm">
              {hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="text-fg-muted hover:text-fg-default underline"
                >
                  Showing {pagedRepos.length} of {visibleRepos.length} — load more
                </button>
              ) : (
                <span className="text-fg-muted">Showing all {visibleRepos.length}</span>
              )}
            </div>
          )}
        </div>
      )}

      {openRepoKey && (
        <RepoDetailModal nameWithOwner={openRepoKey} repos={repos} lists={lists} onClose={closeRepo} />
      )}
    </div>
  )
}
