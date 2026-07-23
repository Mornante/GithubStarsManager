import type { Repo, StarList } from '../../types/github'
import type { DeploymentRecord, ReviewStage } from '../../types/gsmState'
import RepoCard from './RepoCard'

export default function RepoGrid({
  repos,
  lists,
  reviewTags,
  deployments,
  view,
  onOpenRepo,
}: {
  repos: Repo[]
  lists: StarList[]
  reviewTags?: Record<string, ReviewStage>
  deployments?: Record<string, DeploymentRecord>
  view: 'grid' | 'compact'
  onOpenRepo: (nameWithOwner: string) => void
}) {
  if (repos.length === 0) {
    return <p className="text-sm text-fg-muted py-8 text-center">No repositories match the current filters.</p>
  }

  return (
    <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'flex flex-col gap-2'}>
      {repos.map((repo) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          lists={lists}
          reviewTags={reviewTags}
          deployments={deployments}
          view={view}
          onOpen={() => onOpenRepo(repo.nameWithOwner)}
        />
      ))}
    </div>
  )
}
