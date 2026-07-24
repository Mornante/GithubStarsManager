import { fetchOrgPublicMembers } from '../../api/rest'
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import type { OrgMember } from '../../types/github'
import Loader from '../shared/Loader'

export default function OrgPeopleTab({ token, login }: { token: string; login: string }) {
  const {
    items: members,
    status,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<OrgMember>(
    async (cursor) => {
      // REST pagination here is page-number based, not cursor based — the
      // same "stringify the page number into the cursor slot" trick orgsApi.ts
      // already uses for REST-backed org search.
      const page = cursor ? Number(cursor) : 1
      const result = await fetchOrgPublicMembers(token, login, page)
      return { items: result.members, hasNextPage: result.hasMore, endCursor: String(page + 1) }
    },
    [token, login],
  )

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  if (status === 'error') return <p className="text-sm text-danger-fg">{error}</p>

  if (status === 'loading' && members.length === 0) {
    return (
      <div className="py-8 text-center">
        <Loader label="Loading people…" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-fg-muted py-8 text-center">
        No public members found. Only members who've made their organization affiliation public are visible
        here.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {members.map((member) => (
          <a
            key={member.login}
            href={member.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors p-3"
          >
            <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
            <span className="text-sm font-mono truncate">{member.login}</span>
          </a>
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
          <span className="text-fg-muted">Showing all {members.length}</span>
        )}
      </div>
    </>
  )
}
