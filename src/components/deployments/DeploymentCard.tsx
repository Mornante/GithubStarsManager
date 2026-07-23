import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { fetchRepoDeploymentInfo, type RepoDeploymentInfo } from '../../api/deploymentsApi'
import { computeDeploymentDrift } from '../../selectors/deploymentDrift'
import type { DeploymentRecord } from '../../types/gsmState'
import type { Repo } from '../../types/github'
import DriftBadge from '../shared/DriftBadge'

export default function DeploymentCard({
  repo,
  record,
  onOpen,
}: {
  repo: Repo
  record: DeploymentRecord | undefined
  onOpen: () => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const [info, setInfo] = useState<RepoDeploymentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account) return
    let cancelled = false
    setLoading(true)
    fetchRepoDeploymentInfo(account.token, repo.owner.login, repo.name)
      .then((result) => {
        if (!cancelled) {
          setInfo(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, repo.nameWithOwner])

  const drift = record && info ? computeDeploymentDrift(record, info) : null

  return (
    <div
      className="border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors cursor-pointer p-4 flex flex-col gap-2"
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
          <span className="text-xs text-fg-muted">Checking…</span>
        ) : drift ? (
          <DriftBadge drift={drift} />
        ) : null}
      </div>
    </div>
  )
}
