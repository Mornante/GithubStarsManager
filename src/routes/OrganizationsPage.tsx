import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useFollowedOrgs, useOrgsStore } from '../store/orgsStore'
import { useStarredRepos } from '../hooks/useStarredRepos'
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel'
import { useOrgModal } from '../hooks/useOrgModal'
import { useAsync } from '../hooks/useAsync'
import { getOrgDetails } from '../api/orgsApi'
import OrgCard from '../components/orgs/OrgCard'
import OrgDetailModal from '../components/orgs/OrgDetailModal'
import Loader from '../components/shared/Loader'
import { OcticonSearch } from '../components/icons/Octicons'

export default function OrganizationsPage() {
  const account = useAuthStore((s) => s.currentAccount())
  const { repos, lists } = useStarredRepos()
  const followedOrgs = useFollowedOrgs(account?.user.id ?? null)
  const { query, results, status, error, hasMore, search, searchMore, enrichOrgProfiles } = useOrgsStore()
  const { openOrgKey, openOrg, closeOrg } = useOrgModal()

  const [inputValue, setInputValue] = useState(query)

  useEffect(() => {
    if (!account) return
    // Debounced either way — an empty query still runs, since "type:org" alone
    // (sorted by followers) is what powers the default "popular orgs" listing.
    const handle = setTimeout(() => {
      void search(account.user.id, account.token, inputValue.trim())
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, account])

  // Covers orgs followed before this enrichment existed (or discovered via
  // discoverFollowedAmong from a search that isn't re-run every visit) — the
  // "Following" section shouldn't require a fresh search to show real profile data.
  useEffect(() => {
    if (account && followedOrgs.length > 0) {
      void enrichOrgProfiles(account.user.id, account.token, followedOrgs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, followedOrgs])

  const loadMore = useMemo(
    () => () => {
      if (account) void searchMore(account.user.id, account.token)
    },
    [account, searchMore],
  )
  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  // Re-derived from live store state each render, not a snapshot, so follow/unfollow
  // toggles inside the modal stay in sync without needing to close and reopen it.
  const inMemoryOrg = openOrgKey
    ? (results.find((o) => o.login.toLowerCase() === openOrgKey.toLowerCase()) ??
      followedOrgs.find((o) => o.login.toLowerCase() === openOrgKey.toLowerCase()) ??
      null)
    : null

  // Falls back to fetching by login when the org isn't already in memory —
  // e.g. reopened via a deep link (recently-visited nav entry) after it's
  // scrolled out of the search results, mirroring RepoDetailModal's fallback
  // fetch for repos that aren't in the starred list.
  const orgFetcher =
    openOrgKey && !inMemoryOrg && account ? () => getOrgDetails(account.token, openOrgKey) : null
  const { data: fetchedOrg } = useAsync(orgFetcher, [openOrgKey, inMemoryOrg, account])

  const selectedOrg = inMemoryOrg ?? fetchedOrg ?? null

  // Followed orgs already have their own section above — don't show them again here.
  const followedIds = useMemo(() => new Set(followedOrgs.map((o) => o.id)), [followedOrgs])
  const visibleResults = useMemo(() => results.filter((o) => !followedIds.has(o.id)), [results, followedIds])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-semibold">Organizations</h1>
        <p className="text-sm text-fg-muted">
          Browse public organizations and follow the ones worth tracking.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <OcticonSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search organizations…"
            className="w-full pl-10 pr-4 py-2.5 text-lg text-center rounded-full border border-border-default bg-canvas-subtle focus:outline-none focus:ring-2 focus:ring-accent-fg focus:bg-canvas"
          />
        </div>
      </div>

      {followedOrgs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Following</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {followedOrgs.map((org) => (
              <OrgCard key={org.id} org={org} onOpen={() => openOrg(org.login)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {inputValue.trim() ? `Results for "${inputValue.trim()}"` : 'Popular organizations'}
        </h2>
        {!inputValue.trim() && (
          <p className="text-sm text-fg-muted mb-3">
            Sorted by follower count. Search above to narrow this down.
          </p>
        )}

        {status === 'error' && <p className="text-sm text-danger-fg">{error}</p>}
        {status === 'loading' && <Loader label="Loading…" />}
        {status !== 'loading' && results.length === 0 && (
          <p className="text-sm text-fg-muted">No organizations found for that search.</p>
        )}
        {status !== 'loading' && results.length > 0 && visibleResults.length === 0 && (
          <p className="text-sm text-fg-muted">Every match is already in your Following list above.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleResults.map((org) => (
            <OrgCard key={org.id} org={org} onOpen={() => openOrg(org.login)} />
          ))}
        </div>

        {results.length > 0 && (
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
              <span className="text-fg-muted">Showing all {visibleResults.length}</span>
            )}
          </div>
        )}
      </section>

      {selectedOrg && (
        <OrgDetailModal org={selectedOrg} starredRepos={repos} lists={lists} onClose={closeOrg} />
      )}
    </div>
  )
}
