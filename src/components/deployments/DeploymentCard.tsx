import { memo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useRepoDeploymentInfo } from '../../hooks/useRepoDeploymentInfo'
import { computeDeploymentDrift } from '../../selectors/deploymentDrift'
import type { DeploymentRecord } from '../../types/gsmState'
import type { Repo } from '../../types/github'
import DriftBadge from '../shared/DriftBadge'
import Loader from '../shared/Loader'

function DeploymentCard({
  repo,
  record,
  onOpen,
}: {
  repo: Repo
  record: DeploymentRecord | undefined
  onOpen: () => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const { info, loading } = useRepoDeploymentInfo(account?.token, repo.owner.login, repo.name)

  const drift = record && info ? computeDeploymentDrift(record, info) : null

  return (
    <button
      type="button"
      className="w-full text-left border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors cursor-pointer p-4 flex flex-col gap-2"
      onClick={onOpen}
    >
      <span className="font-mono text-sm font-medium truncate block">{repo.nameWithOwner}</span>
      {record ? (
        <p className="text-xs text-fg-muted line-clamp-2">
          {record.environment} · <code className="font-mono">{record.deployedRef}</code> · deployed{' '}
          {new Date(record.deployedAt).toLocaleDateString()}
        </p>
      ) : (
        <p className="text-xs text-fg-muted">No deployment record yet — open to set one.</p>
      )}
      <div className="mt-1">
        {loading ? (
          <Loader label="Checking…" size="sm" />
        ) : drift ? (
          <DriftBadge drift={drift} />
        ) : null}
      </div>
    </button>
  )
}

export default memo(DeploymentCard)
