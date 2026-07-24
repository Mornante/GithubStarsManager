import { githubGraphql } from './githubClient'
import { REPO_ISSUES_QUERY, REPO_PROJECTS_QUERY, REPO_PULL_REQUESTS_QUERY } from './queries'
import type { Issue } from './issuesApi'
import type { OrgProject, RepoPullRequest } from '../types/github'

interface Author {
  login: string
  avatarUrl: string
}

interface RepoIssueNode {
  id: string
  number: number
  title: string
  url: string
  state: 'OPEN' | 'CLOSED'
  updatedAt: string
  author: Author | null
}

interface RepoIssuesResponse {
  repository: {
    issues: {
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: RepoIssueNode[]
    }
  } | null
}

export interface RepoIssuesResult {
  issues: Issue[]
  totalCount: number
  hasNextPage: boolean
  endCursor: string | null
}

export async function fetchRepoIssues(
  token: string,
  owner: string,
  name: string,
  cursor: string | null = null,
): Promise<RepoIssuesResult> {
  const data = await githubGraphql<RepoIssuesResponse>(token, REPO_ISSUES_QUERY, { owner, name, cursor })
  const conn = data.repository?.issues
  const repoNameWithOwner = `${owner}/${name}`
  return {
    issues: (conn?.nodes ?? []).map((node) => ({
      id: node.id,
      number: node.number,
      title: node.title,
      url: node.url,
      state: node.state === 'OPEN' ? 'open' : 'closed',
      updatedAt: node.updatedAt,
      repoNameWithOwner,
      author: node.author,
    })),
    totalCount: conn?.totalCount ?? 0,
    hasNextPage: conn?.pageInfo.hasNextPage ?? false,
    endCursor: conn?.pageInfo.endCursor ?? null,
  }
}

interface RepoPullRequestNode {
  id: string
  number: number
  title: string
  url: string
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  updatedAt: string
  author: Author | null
}

interface RepoPullRequestsResponse {
  repository: {
    pullRequests: {
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: RepoPullRequestNode[]
    }
  } | null
}

export interface RepoPullRequestsResult {
  pullRequests: RepoPullRequest[]
  totalCount: number
  hasNextPage: boolean
  endCursor: string | null
}

export async function fetchRepoPullRequests(
  token: string,
  owner: string,
  name: string,
  cursor: string | null = null,
): Promise<RepoPullRequestsResult> {
  const data = await githubGraphql<RepoPullRequestsResponse>(token, REPO_PULL_REQUESTS_QUERY, { owner, name, cursor })
  const conn = data.repository?.pullRequests
  return {
    pullRequests: (conn?.nodes ?? []).map((node) => ({
      id: node.id,
      number: node.number,
      title: node.title,
      url: node.url,
      state: node.state.toLowerCase() as RepoPullRequest['state'],
      updatedAt: node.updatedAt,
      author: node.author,
    })),
    totalCount: conn?.totalCount ?? 0,
    hasNextPage: conn?.pageInfo.hasNextPage ?? false,
    endCursor: conn?.pageInfo.endCursor ?? null,
  }
}

interface RepoProjectsResponse {
  repository: {
    projectsV2: {
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: OrgProject[]
    }
  } | null
}

export interface RepoProjectsResult {
  projects: OrgProject[]
  totalCount: number
  hasNextPage: boolean
  endCursor: string | null
}

export async function fetchRepoProjects(
  token: string,
  owner: string,
  name: string,
  cursor: string | null = null,
): Promise<RepoProjectsResult> {
  const data = await githubGraphql<RepoProjectsResponse>(token, REPO_PROJECTS_QUERY, { owner, name, cursor })
  const conn = data.repository?.projectsV2
  return {
    projects: conn?.nodes ?? [],
    totalCount: conn?.totalCount ?? 0,
    hasNextPage: conn?.pageInfo.hasNextPage ?? false,
    endCursor: conn?.pageInfo.endCursor ?? null,
  }
}
