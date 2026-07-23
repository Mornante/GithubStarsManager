import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../../store/gsmStateStore'
import { fetchRepoDeploymentInfo, type RepoDeploymentInfo } from '../../api/deploymentsApi'
import { computeDeploymentDrift } from '../../selectors/deploymentDrift'
import type { DeploymentRecord } from '../../types/gsmState'
import type { Repo } from '../../types/github'
import DriftBadge from '../shared/DriftBadge'
import ConfirmDialog from '../shared/ConfirmDialog'

type Tab = 'view' | 'edit'

export default function DeploymentModal({ repo, onClose }: { repo: Repo; onClose: () => void }) {
  const account = useAuthStore((s) => s.currentAccount())
  const gsm = useGsmUserState(account?.user.id ?? null)
  const setDeployment = useGsmStateStore((s) => s.setDeployment)
  const clearDeployment = useGsmStateStore((s) => s.clearDeployment)

  const record = gsm.state.deployments[repo.id]
  const isDeployed = Boolean(record)

  const [tab, setTab] = useState<Tab>(isDeployed ? 'view' : 'edit')
  const [info, setInfo] = useState<RepoDeploymentInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [environment, setEnvironment] = useState(record?.environment ?? 'production')
  const [refValue, setRefValue] = useState(record?.deployedRef ?? '')
  const [refType, setRefType] = useState<'release' | 'commit'>(record?.deployedRefType ?? 'release')
  const [saving, setSaving] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  useEffect(() => {
    if (!account) return
    let cancelled = false
    setLoadingInfo(true)
    fetchRepoDeploymentInfo(account.token, repo.owner.login, repo.name)
      .then((result) => {
        if (cancelled) return
        setInfo(result)
        setLoadingInfo(false)
        if (!record) {
          if (result.releases.length > 0) {
            setRefValue(result.releases[0].tagName)
            setRefType('release')
          } else if (result.recentCommits.length > 0) {
            setRefValue(result.recentCommits[0].oid.slice(0, 7))
            setRefType('commit')
          }
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingInfo(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, repo.nameWithOwner])

  function handleQuickFillLatest() {
    if (!info) return
    if (info.releases.length > 0) {
      setRefValue(info.releases[0].tagName)
      setRefType('release')
    } else if (info.recentCommits.length > 0) {
      setRefValue(info.recentCommits[0].oid.slice(0, 7))
      setRefType('commit')
    }
  }

  function handleDeployLatest() {
    handleQuickFillLatest()
    setTab('edit')
  }

  async function handleSave() {
    if (!account || !gsm.gistId || !refValue.trim()) return
    setSaving(true)
    try {
      const newRecord: DeploymentRecord = {
        environment: environment.trim() || 'production',
        deployedRef: refValue.trim(),
        deployedRefType: refType,
        deployedAt: new Date().toISOString(),
      }
      await setDeployment(account.user.id, account.token, repo.id, newRecord)
      setTab('view')
    } finally {
      setSaving(false)
    }
  }

  function handleConfirmRemove() {
    if (!account || !gsm.gistId) return
    void clearDeployment(account.user.id, account.token, repo.id)
    setConfirmingRemove(false)
    onClose()
  }

  const drift = record && info ? computeDeploymentDrift(record, info) : null
  const hasNewerVersion = drift?.kind === 'behind' || drift?.kind === 'behind-unknown'
  const latestVersionLabel = info?.releases[0]?.tagName ?? (info?.recentCommits[0] ? info.recentCommits[0].oid.slice(0, 7) : null)
  const latestSuggestion = info?.releases[0]
    ? `release (${info.releases[0].tagName})`
    : info?.recentCommits[0]
      ? `commit (${info.recentCommits[0].oid.slice(0, 7)})`
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md border border-border-default bg-canvas flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h3 className="text-base font-semibold">Deployment — {repo.name}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-fg-muted hover:text-fg-default text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-border-default">
          <button
            type="button"
            onClick={() => setTab('view')}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
              tab === 'view' ? 'bg-canvas-subtle border border-b-0 border-border-default' : 'text-fg-muted'
            }`}
          >
            View
          </button>
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
              tab === 'edit' ? 'bg-canvas-subtle border border-b-0 border-border-default' : 'text-fg-muted'
            }`}
          >
            Edit
          </button>
        </div>

        <div className="p-4">
          {!gsm.gistId ? (
            <p className="text-sm text-fg-muted">Loading your GSM:STATE gist…</p>
          ) : tab === 'view' ? (
            <div className="space-y-4">
              {isDeployed && record ? (
                <div className="rounded-md border border-border-default bg-canvas-subtle p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Currently deployed</span>
                    {drift && <DriftBadge drift={drift} />}
                  </div>
                  <p className="text-xs text-fg-muted mt-1">
                    {record.environment} · <code className="font-mono">{record.deployedRef}</code> ·{' '}
                    {new Date(record.deployedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-fg-muted">Not deployed yet — switch to Edit to track a deployment.</p>
              )}

              {hasNewerVersion && latestVersionLabel && (
                <div className="rounded-md border border-success-fg/40 bg-success-fg/10 px-4 py-3 text-sm flex items-center justify-between gap-4">
                  <span className="text-success-fg font-medium">
                    New version available — {latestVersionLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeployLatest}
                    className="shrink-0 rounded-md bg-success-emphasis text-white text-xs font-medium px-3 py-1.5"
                  >
                    Deploy
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Environment</label>
                <input
                  type="text"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="production"
                  className="w-full text-sm rounded-md border border-border-default bg-canvas px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Deployed ref</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refValue}
                    onChange={(e) => setRefValue(e.target.value)}
                    placeholder="v1.2.0 or commit sha"
                    className="flex-1 text-sm rounded-md border border-border-default bg-canvas px-3 py-1.5 font-mono"
                  />
                  <select
                    value={refType}
                    onChange={(e) => setRefType(e.target.value as 'release' | 'commit')}
                    className="text-sm rounded-md border border-border-default bg-canvas px-2 py-1.5"
                  >
                    <option value="release">Release</option>
                    <option value="commit">Commit</option>
                  </select>
                </div>
                {loadingInfo ? (
                  <p className="text-xs text-fg-muted mt-1">Checking releases/commits…</p>
                ) : latestSuggestion ? (
                  <button
                    type="button"
                    onClick={handleQuickFillLatest}
                    className="text-xs text-accent-fg hover:underline mt-1"
                  >
                    Use latest {latestSuggestion}
                  </button>
                ) : (
                  <p className="text-xs text-fg-muted mt-1">No releases or commit history found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {gsm.gistId && (
          <div className="flex items-center justify-between p-4 border-t border-border-default">
            {isDeployed ? (
              <button
                type="button"
                onClick={() => setConfirmingRemove(true)}
                className="text-sm text-danger-fg hover:underline"
              >
                Remove from deployments
              </button>
            ) : (
              <span />
            )}
            {tab === 'edit' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !refValue.trim()}
                className="rounded-md bg-accent-emphasis text-white text-sm font-medium px-3 py-1.5 disabled:opacity-50"
              >
                {saving ? 'Saving…' : isDeployed ? 'Update' : 'Mark as deployed'}
              </button>
            )}
          </div>
        )}
      </div>

      {confirmingRemove && (
        <ConfirmDialog
          title="Remove this deployment record?"
          message={`This permanently removes the deployment tracking for ${repo.name} from your GSM:STATE gist. This can't be undone.`}
          confirmLabel="Remove"
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}
    </div>
  )
}
