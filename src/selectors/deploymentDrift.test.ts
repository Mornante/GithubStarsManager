import { describe, expect, it } from 'vitest'
import { computeDeploymentDrift } from './deploymentDrift'
import type { DeploymentRecord } from '../types/gsmState'
import type { RepoDeploymentInfo } from '../api/deploymentsApi'

function releaseRecord(deployedRef: string): DeploymentRecord {
  return { environment: 'production', deployedRef, deployedRefType: 'release', deployedAt: '2024-01-01T00:00:00Z' }
}

function commitRecord(deployedRef: string): DeploymentRecord {
  return { environment: 'production', deployedRef, deployedRefType: 'commit', deployedAt: '2024-01-01T00:00:00Z' }
}

const info: RepoDeploymentInfo = {
  releasesTotalCount: 3,
  releases: [
    { tagName: 'v3.0.0', name: null, publishedAt: null, url: '', isPrerelease: false },
    { tagName: 'v2.0.0', name: null, publishedAt: null, url: '', isPrerelease: false },
    { tagName: 'v1.0.0', name: null, publishedAt: null, url: '', isPrerelease: false },
  ],
  recentCommits: [
    { oid: 'cccccccccccc', committedDate: '2024-03-01', messageHeadline: 'c' },
    { oid: 'bbbbbbbbbbbb', committedDate: '2024-02-01', messageHeadline: 'b' },
    { oid: 'aaaaaaaaaaaa', committedDate: '2024-01-01', messageHeadline: 'a' },
  ],
}

const emptyInfo: RepoDeploymentInfo = { releasesTotalCount: 0, releases: [], recentCommits: [] }

describe('computeDeploymentDrift', () => {
  it('reports up-to-date when the deployed release is the newest', () => {
    expect(computeDeploymentDrift(releaseRecord('v3.0.0'), info)).toEqual({ kind: 'up-to-date' })
  })

  it('counts releases behind when the deployed release is older', () => {
    expect(computeDeploymentDrift(releaseRecord('v1.0.0'), info)).toEqual({ kind: 'behind', count: 2, unit: 'release' })
  })

  it('reports behind-unknown when the deployed release fell outside the fetched window', () => {
    expect(computeDeploymentDrift(releaseRecord('v0.1.0'), info)).toEqual({ kind: 'behind-unknown', unit: 'release' })
  })

  it('reports unknown when there is no release history to compare against', () => {
    expect(computeDeploymentDrift(releaseRecord('v0.1.0'), emptyInfo)).toEqual({ kind: 'unknown' })
  })

  it('matches commits by full oid', () => {
    expect(computeDeploymentDrift(commitRecord('bbbbbbbbbbbb'), info)).toEqual({ kind: 'behind', count: 1, unit: 'commit' })
  })

  it('matches commits by short (prefix) sha', () => {
    expect(computeDeploymentDrift(commitRecord('ccc'), info)).toEqual({ kind: 'up-to-date' })
  })

  it('reports behind-unknown when the deployed commit fell outside the fetched window', () => {
    expect(computeDeploymentDrift(commitRecord('deadbeef'), info)).toEqual({ kind: 'behind-unknown', unit: 'commit' })
  })

  it('reports unknown when there is no commit history to compare against', () => {
    expect(computeDeploymentDrift(commitRecord('deadbeef'), emptyInfo)).toEqual({ kind: 'unknown' })
  })
})
