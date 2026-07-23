import { useMemo } from 'react'
import { useStarredRepos } from '../hooks/useStarredRepos'
import { useGsmState } from '../hooks/useGsmState'
import { useRepoModal } from '../hooks/useRepoModal'
import DeploymentCard from '../components/deployments/DeploymentCard'
import DeploymentModal from '../components/repos/DeploymentModal'

export default function DeploymentsPage() {
  const { repos, status } = useStarredRepos()
  const { deployments, status: gsmStatus, error: gsmError, retry: gsmRetry } = useGsmState()
  const { openRepoKey, openRepo, closeRepo } = useRepoModal()

  const deployedRepos = useMemo(() => repos.filter((r) => Boolean(deployments[r.id])), [repos, deployments])
  const openRepoObj = openRepoKey
    ? repos.find((r) => r.nameWithOwner.toLowerCase() === openRepoKey.toLowerCase())
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Deployments</h1>
        <p className="text-sm text-fg-muted">
          Track what's deployed where, and how far it's drifted from the latest release or commit.
        </p>
      </div>

      {gsmStatus === 'error' && (
        <div className="rounded-md border border-danger-fg/40 bg-danger-fg/10 px-4 py-3 text-sm text-danger-fg flex items-center justify-between gap-4">
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

      {status === 'syncing' && repos.length === 0 ? (
        <p className="text-sm text-fg-muted">Loading your starred repositories…</p>
      ) : deployedRepos.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Nothing tracked yet. Open a starred repo's Actions menu and choose "Deploy…" to start tracking one.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deployedRepos.map((repo) => (
            <DeploymentCard
              key={repo.id}
              repo={repo}
              record={deployments[repo.id]}
              onOpen={() => openRepo(repo.nameWithOwner)}
            />
          ))}
        </div>
      )}

      {openRepoObj && <DeploymentModal repo={openRepoObj} onClose={closeRepo} />}
    </div>
  )
}
