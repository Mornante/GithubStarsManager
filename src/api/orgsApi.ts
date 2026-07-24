import { githubGraphql, githubRest } from './githubClient'
import { SEARCH_PAGE_SIZE, searchOrganizationsByFollowers, type OrgSearchResult } from './rest'
import {
  FOLLOW_ORGANIZATION_MUTATION,
  ORG_PROJECTS_QUERY,
  ORG_REPOSITORIES_QUERY,
  ORG_VIEWER_FOLLOWING_QUERY,
  UNFOLLOW_ORGANIZATION_MUTATION,
} from './queries'
import type { Organization, OrgProject, Repo } from '../types/github'

// Search results only ever carry login/avatar/url (see the comment on
// OrgSearchResult) — everything else starts null and is filled in afterward
// by enrichOrgProfiles (store/orgsStore.ts) calling getOrgDetails below.
function mapOrg(item: OrgSearchResult): Organization {
  return {
    id: item.node_id,
    login: item.login,
    name: null,
    avatarUrl: item.avatar_url,
    description: null,
    url: item.html_url,
    websiteUrl: null,
    location: null,
    repoCount: null,
    memberCount: null,
    followerCount: null,
    // REST search can't tell us per-viewer follow state — callers reconcile
    // this against the locally-followed cache, and OrgDetailModal re-checks
    // the real value via GraphQL when a specific org is opened.
    viewerIsFollowing: false,
  }
}

interface OrgDetailsResponse {
  login: string
  node_id: string
  name: string | null
  description: string | null
  avatar_url: string
  html_url: string
  blog: string | null
  location: string | null
  followers: number
  public_repos: number
}

// The one REST endpoint that actually returns an org's follower count, location,
// and website — `GET /orgs/{login}` (its "Get an organization" full profile),
// as opposed to the sparse search-result object mapOrg builds from.
export async function getOrgDetails(token: string, login: string): Promise<Organization> {
  const data = await githubRest<OrgDetailsResponse>(token, `/orgs/${login}`)
  return {
    id: data.node_id,
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    description: data.description,
    url: data.html_url,
    websiteUrl: data.blog || null,
    location: data.location,
    repoCount: data.public_repos,
    memberCount: null, // not exposed by this endpoint either
    followerCount: data.followers,
    viewerIsFollowing: false, // caller merges in the real follow state separately
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

interface OrgProjectsResponse {
  organization: {
    projectsV2: {
      totalCount: number
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: OrgProject[]
    }
  } | null
}

export interface OrgProjectsResult {
  projects: OrgProject[]
  totalCount: number
  hasNextPage: boolean
  endCursor: string | null
}

export async function fetchOrgProjects(
  token: string,
  login: string,
  cursor: string | null = null,
): Promise<OrgProjectsResult> {
  const data = await githubGraphql<OrgProjectsResponse>(token, ORG_PROJECTS_QUERY, { login, cursor })
  const conn = data.organization?.projectsV2
  return {
    projects: conn?.nodes ?? [],
    totalCount: conn?.totalCount ?? 0,
    hasNextPage: conn?.pageInfo.hasNextPage ?? false,
    endCursor: conn?.pageInfo.endCursor ?? null,
  }
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
