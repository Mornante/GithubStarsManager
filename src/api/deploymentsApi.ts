import { githubGraphql } from './githubClient'
import { REPO_DEPLOYMENT_INFO_QUERY } from './queries'

export interface ReleaseInfo {
  tagName: string
  name: string | null
  publishedAt: string | null
  url: string
  isPrerelease: boolean
}

export interface CommitInfo {
  oid: string
  committedDate: string
  messageHeadline: string
}

export interface RepoDeploymentInfo {
  releasesTotalCount: number
  releases: ReleaseInfo[]
  // Most-recent-first, capped at 30 — enough to locate a previously-deployed
  // commit and count how many commits have landed since, for typical repos.
  recentCommits: CommitInfo[]
}

interface RepoDeploymentInfoResponse {
  repository: {
    releases: { totalCount: number; nodes: ReleaseInfo[] }
    defaultBranchRef: { target: { history: { nodes: CommitInfo[] } } | null } | null
  } | null
}

export async function fetchRepoDeploymentInfo(
  token: string,
  owner: string,
  name: string,
): Promise<RepoDeploymentInfo> {
  const data = await githubGraphql<RepoDeploymentInfoResponse>(token, REPO_DEPLOYMENT_INFO_QUERY, { owner, name })
  const repo = data.repository
  return {
    releasesTotalCount: repo?.releases.totalCount ?? 0,
    releases: repo?.releases.nodes ?? [],
    recentCommits: repo?.defaultBranchRef?.target?.history.nodes ?? [],
  }
}
