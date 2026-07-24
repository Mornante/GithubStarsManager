import { fetchRepoProjects } from '../../api/repoApi'
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch'
import { useInfiniteScrollSentinel } from '../../hooks/useInfiniteScrollSentinel'
import type { OrgProject } from '../../types/github'
import Loader from '../shared/Loader'

export default function RepoProjectsTab({
  token,
  owner,
  name,
}: {
  token: string
  owner: string
  name: string
}) {
  const {
    items: projects,
    status,
    error,
    hasMore,
    loadMore,
  } = usePaginatedFetch<OrgProject>(
    async (cursor) => {
      const result = await fetchRepoProjects(token, owner, name, cursor)
      return { items: result.projects, hasNextPage: result.hasNextPage, endCursor: result.endCursor }
    },
    [token, owner, name],
  )

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore)

  if (status === 'error') return <p className="text-sm text-danger-fg">{error}</p>

  if (status === 'loading' && projects.length === 0) {
    return (
      <div className="py-8 text-center">
        <Loader label="Loading projects…" />
      </div>
    )
  }

  if (projects.length === 0) {
    return <p className="text-sm text-fg-muted py-8 text-center">No projects found.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map((project) => (
          <a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className={`border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors p-4 flex flex-col gap-1 ${
              project.closed ? 'opacity-60' : ''
            }`}
          >
            <span className="text-sm font-medium truncate">{project.title}</span>
            {project.shortDescription && (
              <p className="text-xs text-fg-muted line-clamp-2">{project.shortDescription}</p>
            )}
            {project.closed && <span className="text-xs text-fg-muted">Closed</span>}
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
          <span className="text-fg-muted">Showing all {projects.length}</span>
        )}
      </div>
    </>
  )
}
