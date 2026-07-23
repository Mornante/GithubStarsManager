import type { DeploymentRecord } from '../types/gsmState'
import type { RepoDeploymentInfo } from '../api/deploymentsApi'

export type DeploymentDrift =
  | { kind: 'up-to-date' }
  | { kind: 'behind'; count: number; unit: 'release' | 'commit' }
  // Deployed ref is older than everything we fetched (capped window) — exact count unknown.
  | { kind: 'behind-unknown'; unit: 'release' | 'commit' }
  // No releases and no commit history at all to compare against.
  | { kind: 'unknown' }

export function computeDeploymentDrift(record: DeploymentRecord, info: RepoDeploymentInfo): DeploymentDrift {
  if (record.deployedRefType === 'release') {
    const idx = info.releases.findIndex((r) => r.tagName === record.deployedRef)
    if (idx === -1) return info.releases.length > 0 ? { kind: 'behind-unknown', unit: 'release' } : { kind: 'unknown' }
    return idx === 0 ? { kind: 'up-to-date' } : { kind: 'behind', count: idx, unit: 'release' }
  }

  const idx = info.recentCommits.findIndex(
    (c) => c.oid === record.deployedRef || c.oid.startsWith(record.deployedRef),
  )
  if (idx === -1) return info.recentCommits.length > 0 ? { kind: 'behind-unknown', unit: 'commit' } : { kind: 'unknown' }
  return idx === 0 ? { kind: 'up-to-date' } : { kind: 'behind', count: idx, unit: 'commit' }
}
