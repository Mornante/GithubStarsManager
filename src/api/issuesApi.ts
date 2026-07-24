import { githubRest } from './githubClient'
import { SEARCH_PAGE_SIZE } from './rest'

export interface Issue {
  id: string
  number: number
  title: string
  url: string
  state: 'open' | 'closed'
  updatedAt: string
  repoNameWithOwner: string
  author: { login: string; avatarUrl: string } | null
}

interface IssueSearchItem {
  id: number
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  updated_at: string
  repository_url: string
  user: { login: string; avatar_url: string } | null
  // Issues and PRs share the same search index — presence of this field means
  // the result is actually a PR, filtered out client-side as a defensive
  // backstop even though `is:issue` in the query should already exclude them.
  pull_request?: unknown
}

interface IssueSearchResponse {
  items: IssueSearchItem[]
  total_count: number
}

export interface SearchIssuesResult {
  issues: Issue[]
  totalCount: number
}

// The Search API only paginates through the first 1000 results for any query.
const SEARCH_API_RESULT_CAP = 1000

function repoNameFromUrl(repositoryUrl: string): string {
  return repositoryUrl.replace('https://api.github.com/repos/', '')
}

function mapIssue(item: IssueSearchItem): Issue {
  return {
    id: String(item.id),
    number: item.number,
    title: item.title,
    url: item.html_url,
    state: item.state,
    updatedAt: item.updated_at,
    repoNameWithOwner: repoNameFromUrl(item.repository_url),
    author: item.user ? { login: item.user.login, avatarUrl: item.user.avatar_url } : null,
  }
}

// "Issues I have" = involves:@me (author, assignee, mentioned, or commenter) —
// GitHub-wide, not scoped to starred repos, since the Search API has no clean
// way to filter by an arbitrary large list of repos.
export async function searchMyIssues(token: string, searchText: string, page = 1): Promise<SearchIssuesResult> {
  const qParts = ['is:issue', 'involves:@me']
  if (searchText.trim()) qParts.push(searchText.trim())
  const query = encodeURIComponent(qParts.join(' '))
  const data = await githubRest<IssueSearchResponse>(
    token,
    `/search/issues?q=${query}&sort=updated&order=desc&per_page=${SEARCH_PAGE_SIZE}&page=${page}`,
  )
  return {
    issues: data.items.filter((item) => !item.pull_request).map(mapIssue),
    totalCount: Math.min(data.total_count, SEARCH_API_RESULT_CAP),
  }
}
