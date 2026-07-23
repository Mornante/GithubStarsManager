import { useStarredRepos } from '../hooks/useStarredRepos'
import { useRepoModal } from '../hooks/useRepoModal'
import TrendingSection from '../components/dashboard/TrendingSection'
import RepoDetailModal from '../components/repos/RepoDetailModal'
import Loader from '../components/shared/Loader'

export default function DiscoveryPage() {
  const { repos, lists, status } = useStarredRepos()
  const { openRepoKey, openRepo, closeRepo } = useRepoModal()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Discovery</h1>
        <p className="text-sm text-fg-muted">Trending repos you haven't starred yet.</p>
      </div>

      {status === 'syncing' && repos.length === 0 ? (
        <Loader label="Loading your starred repositories…" />
      ) : (
        <TrendingSection repos={repos} onOpenRepo={openRepo} />
      )}

      {openRepoKey && (
        <RepoDetailModal nameWithOwner={openRepoKey} repos={repos} lists={lists} onClose={closeRepo} />
      )}
    </div>
  )
}
