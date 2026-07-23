import { githubGraphql } from './githubClient'
import { SEARCH_PAGE_SIZE, searchOrganizationsByFollowers, type OrgSearchResult } from './rest'
import {
  FOLLOW_ORGANIZATION_MUTATION,
  ORG_REPOSITORIES_QUERY,
  ORG_VIEWER_FOLLOWING_QUERY,
  UNFOLLOW_ORGANIZATION_MUTATION,
} from './queries'
import type { Organization, Repo } from '../types/github'

function mapOrg(item: OrgSearchResult): Organization {
  return {
    id: item.node_id,
    login: item.login,
    name: item.name,
    avatarUrl: item.avatar_url,
    description: item.bio,
    url: item.html_url,
    websiteUrl: item.blog || null,
    location: item.location,
    repoCount: item.public_repos,
    memberCount: null, // not exposed by the REST search endpoint
    followerCount: item.followers,
    // REST search can't tell us per-viewer follow state — callers reconcile
    // this against the locally-followed cache, and OrgDetailModal re-checks
    // the real value via GraphQL when a specific org is opened.
    viewerIsFollowing: false,
  }
}

export interface SearchOrganizationsResult {
  organizations: Organization[]
  hasNextPage: boolean
  endCursor: string | null
}

// Sorted by follower count (GitHub's REST Search API supports sort=followers;
// the GraphQL `search` field has no sort option at all, relevance-only). Passing
// an empty query still works — "type:org" alone yields a default "most followed
// public orgs" listing, which is what powers the page's default view.
export async function searchOrganizations(
  token: string,
  query: string,
  cursor: string | null = null,
): Promise<SearchOrganizationsResult> {
  const page = cursor ? Number(cursor) : 1
  const { items, totalCount } = await searchOrganizationsByFollowers(token, query, page)
  const fetchedSoFar = (page - 1) * SEARCH_PAGE_SIZE + items.length
  return {
    organizations: items.map(mapOrg),
    hasNextPage: items.length === SEARCH_PAGE_SIZE && fetchedSoFar < totalCount,
    endCursor: String(page + 1),
  }
}

interface OrgRepositoriesResponse {
  organization: {
    repositories: {
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: {
        id: string
        name: string
        nameWithOwner: string
        owner: { login: string; avatarUrl: string }
        description: string | null
        url: string
        homepageUrl: string | null
        sshUrl: string
        stargazerCount: number
        forkCount: number
        updatedAt: string
        primaryLanguage: { name: string; color: string | null } | null
        licenseInfo: { spdxId: string | null; name: string } | null
        repositoryTopics: { nodes: { topic: { name: string } }[] }
      }[]
    }
  }
}

export interface OrgRepositoriesResult {
  repos: Repo[]
  totalCount: number
  hasNextPage: boolean
  endCursor: string | null
}

export async function fetchOrgRepositories(
  token: string,
  login: string,
  cursor: string | null = null,
): Promise<OrgRepositoriesResult> {
  const data = await githubGraphql<OrgRepositoriesResponse>(token, ORG_REPOSITORIES_QUERY, { login, cursor })
  const { nodes, totalCount, pageInfo } = data.organization.repositories
  const repos: Repo[] = nodes.map((node) => ({
    id: node.id,
    name: node.name,
    nameWithOwner: node.nameWithOwner,
    owner: node.owner,
    description: node.description,
    url: node.url,
    homepageUrl: node.homepageUrl,
    sshUrl: node.sshUrl,
    stargazerCount: node.stargazerCount,
    forkCount: node.forkCount,
    updatedAt: node.updatedAt,
    starredAt: '',
    primaryLanguage: node.primaryLanguage,
    licenseInfo: node.licenseInfo,
    topics: node.repositoryTopics.nodes.map((n) => n.topic.name),
    listIds: [],
  }))
  return { repos, totalCount, hasNextPage: pageInfo.hasNextPage, endCursor: pageInfo.endCursor }
}

export async function followOrganization(token: string, orgId: string): Promise<void> {
  await githubGraphql(token, FOLLOW_ORGANIZATION_MUTATION, { orgId })
}

export async function unfollowOrganization(token: string, orgId: string): Promise<void> {
  await githubGraphql(token, UNFOLLOW_ORGANIZATION_MUTATION, { orgId })
}

interface OrgViewerFollowingResponse {
  organization: { viewerIsFollowing: boolean } | null
}

// The only source of truth for "does the viewer actually follow this org" —
// REST search can't answer that, so this is checked fresh whenever a specific
// org's detail modal opens, to catch orgs followed outside this app.
export async function fetchOrgViewerIsFollowing(token: string, login: string): Promise<boolean> {
  const data = await githubGraphql<OrgViewerFollowingResponse>(token, ORG_VIEWER_FOLLOWING_QUERY, { login })
  return data.organization?.viewerIsFollowing ?? false
}
