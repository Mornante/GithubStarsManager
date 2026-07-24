import { githubRest } from './githubClient'
import type { GithubUser, OrgMember, Repo } from '../types/github'

interface ViewerResponse {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export async function getViewer(token: string): Promise<GithubUser> {
  const data = await githubRest<ViewerResponse>(token, '/user')
  return {
    id: String(data.id),
    login: data.login,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
  }
}

export interface SearchRepoResult {
  id: number
  name: string
  full_name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
}

interface SearchResponse {
  items: SearchRepoResult[]
  total_count: number
}

export interface SearchRepositoriesResult {
  items: SearchRepoResult[]
  totalCount: number
}

const MIN_STARS_FLOOR = 50
export const SEARCH_PAGE_SIZE = 30
// The Search API only paginates through the first 1000 results for any query.
const SEARCH_API_RESULT_CAP = 1000

export async function searchRepositories(
  token: string,
  params: { createdAfter: string; language?: string; page?: number },
): Promise<SearchRepositoriesResult> {
  const qParts = [`stars:>${MIN_STARS_FLOOR}`, `created:>${params.createdAfter}`]
  if (params.language) qParts.push(`language:${params.language}`)

  const query = encodeURIComponent(qParts.join(' '))
  const page = params.page ?? 1
  const data = await githubRest<SearchResponse>(
    token,
    `/search/repositories?q=${query}&sort=stars&order=desc&per_page=${SEARCH_PAGE_SIZE}&page=${page}`,
  )
  return { items: data.items, totalCount: Math.min(data.total_count, SEARCH_API_RESULT_CAP) }
}

// GitHub's search-result user/org object is sparse — despite what older docs/
// examples imply, `/search/users` does NOT actually return `bio`, `location`,
// `blog`, `followers`, or `public_repos` in practice, only these fields. Full
// profile data has to be fetched per-org afterward (see `getOrgDetails` in
// orgsApi.ts) — this is not a redundant call, it's the only way to get that data.
export interface OrgSearchResult {
  login: string
  node_id: string
  avatar_url: string
  html_url: string
}

interface SearchUsersResponse {
  items: OrgSearchResult[]
  total_count: number
}

export interface SearchOrganizationsResult {
  items: OrgSearchResult[]
  totalCount: number
}

// The GraphQL `search` field has no sort option at all (relevance only), but the
// REST Search API supports sort=followers. `type:org` restricts to organizations
// the same way it does in GraphQL search query text.
export async function searchOrganizationsByFollowers(
  token: string,
  query: string,
  page = 1,
): Promise<SearchOrganizationsResult> {
  const q = `type:org${query.trim() ? ` ${query.trim()}` : ''}`
  const data = await githubRest<SearchUsersResponse>(
    token,
    `/search/users?q=${encodeURIComponent(q)}&sort=followers&order=desc&per_page=${SEARCH_PAGE_SIZE}&page=${page}`,
  )
  return { items: data.items, totalCount: Math.min(data.total_count, SEARCH_API_RESULT_CAP) }
}

interface ReadmeResponse {
  content: string
  encoding: string
}

// `atob` only decodes to Latin-1 code points — routing those bytes through
// TextDecoder (rather than the deprecated `escape`/`decodeURIComponent`
// pairing) correctly reassembles the original UTF-8 text, including
// non-Latin1 README content.
function decodeBase64Utf8(base64: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function getReadme(token: string, owner: string, repo: string): Promise<string | null> {
  try {
    const data = await githubRest<ReadmeResponse>(token, `/repos/${owner}/${repo}/readme`)
    const base64 = data.content.replace(/\n/g, '')
    return decodeBase64Utf8(base64)
  } catch {
    return null
  }
}

// Org profile READMEs live at a fixed path in the org's special `.github` repo.
// Not every org has one, so a 404 here just means "no profile README" — not an error.
export async function getOrgProfileReadme(token: string, login: string): Promise<string | null> {
  try {
    const data = await githubRest<ReadmeResponse>(token, `/repos/${login}/.github/contents/profile/README.md`)
    const base64 = data.content.replace(/\n/g, '')
    return decodeBase64Utf8(base64)
  } catch {
    return null
  }
}

interface PublicMemberResponse {
  login: string
  avatar_url: string
  html_url: string
}

export interface OrgMembersResult {
  members: OrgMember[]
  hasMore: boolean
}

const ORG_MEMBERS_PAGE_SIZE = 30

// There is no GraphQL/REST way to list *all* members of an org without being
// a member yourself — this only returns members who've chosen to make their
// affiliation public, same as the "People" tab shows a logged-out visitor on
// github.com. REST doesn't expose a total count here, so "more pages exist"
// is inferred the same way SEARCH_PAGE_SIZE results are elsewhere: a full
// page suggests there may be another.
export async function fetchOrgPublicMembers(token: string, login: string, page = 1): Promise<OrgMembersResult> {
  const data = await githubRest<PublicMemberResponse[]>(
    token,
    `/orgs/${login}/public_members?per_page=${ORG_MEMBERS_PAGE_SIZE}&page=${page}`,
  )
  return {
    members: data.map((m) => ({ login: m.login, avatarUrl: m.avatar_url, url: m.html_url })),
    hasMore: data.length === ORG_MEMBERS_PAGE_SIZE,
  }
}

export async function starRepo(token: string, owner: string, repo: string): Promise<void> {
  await githubRest(token, `/user/starred/${owner}/${repo}`, { method: 'PUT' })
}

export async function unstarRepo(token: string, owner: string, repo: string): Promise<void> {
  await githubRest(token, `/user/starred/${owner}/${repo}`, { method: 'DELETE' })
}

interface RestRepoResponse {
  node_id: string
  name: string
  full_name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  html_url: string
  homepage: string | null
  ssh_url: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  language: string | null
  license: { spdx_id: string | null; name: string } | null
  topics: string[]
}

// Used to preview a repo that isn't in the local starred cache yet (e.g. opened
// from Discovery). `node_id` is the same global id GraphQL list mutations expect,
// so once the repo is starred this same id can be used for list membership calls.
export async function getRepoDetails(token: string, owner: string, repo: string): Promise<Repo> {
  const data = await githubRest<RestRepoResponse>(token, `/repos/${owner}/${repo}`)
  return {
    id: data.node_id,
    name: data.name,
    nameWithOwner: data.full_name,
    owner: { login: data.owner.login, avatarUrl: data.owner.avatar_url },
    description: data.description,
    url: data.html_url,
    homepageUrl: data.homepage,
    sshUrl: data.ssh_url,
    stargazerCount: data.stargazers_count,
    forkCount: data.forks_count,
    updatedAt: data.updated_at,
    starredAt: '',
    primaryLanguage: data.language ? { name: data.language, color: null } : null,
    licenseInfo: data.license ? { spdxId: data.license.spdx_id, name: data.license.name } : null,
    topics: data.topics ?? [],
    listIds: [],
  }
}
