import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./githubClient', () => ({ githubGraphql: vi.fn() }))

import { githubGraphql } from './githubClient'
import { fetchRepoIssues, fetchRepoPullRequests, fetchRepoProjects } from './repoApi'

const TOKEN = 'token'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchRepoIssues', () => {
  it('maps GraphQL OPEN/CLOSED state to lowercase and stamps repoNameWithOwner', async () => {
    vi.mocked(githubGraphql).mockResolvedValue({
      repository: {
        issues: {
          totalCount: 1,
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [
            {
              id: 'i1',
              number: 5,
              title: 'Bug report',
              url: 'https://github.com/octo/repo/issues/5',
              state: 'OPEN',
              updatedAt: '2024-01-01T00:00:00Z',
              author: { login: 'octocat', avatarUrl: 'https://example.com/a.png' },
            },
          ],
        },
      },
    })

    const result = await fetchRepoIssues(TOKEN, 'octo', 'repo')

    expect(result.issues).toEqual([
      {
        id: 'i1',
        number: 5,
        title: 'Bug report',
        url: 'https://github.com/octo/repo/issues/5',
        state: 'open',
        updatedAt: '2024-01-01T00:00:00Z',
        repoNameWithOwner: 'octo/repo',
        author: { login: 'octocat', avatarUrl: 'https://example.com/a.png' },
      },
    ])
    expect(result.hasNextPage).toBe(false)
  })

  it('falls back to empty/false when repository is null', async () => {
    vi.mocked(githubGraphql).mockResolvedValue({ repository: null })

    const result = await fetchRepoIssues(TOKEN, 'octo', 'repo')

    expect(result).toEqual({ issues: [], totalCount: 0, hasNextPage: false, endCursor: null })
  })
})

describe('fetchRepoPullRequests', () => {
  it('maps all three GraphQL PR states to lowercase, including MERGED', async () => {
    vi.mocked(githubGraphql).mockResolvedValue({
      repository: {
        pullRequests: {
          totalCount: 2,
          pageInfo: { hasNextPage: true, endCursor: 'cursor2' },
          nodes: [
            { id: 'p1', number: 1, title: 'Add feature', url: 'u1', state: 'MERGED', updatedAt: 't1', author: null },
            { id: 'p2', number: 2, title: 'WIP', url: 'u2', state: 'OPEN', updatedAt: 't2', author: null },
          ],
        },
      },
    })

    const result = await fetchRepoPullRequests(TOKEN, 'octo', 'repo')

    expect(result.pullRequests.map((pr) => pr.state)).toEqual(['merged', 'open'])
    expect(result.hasNextPage).toBe(true)
    expect(result.endCursor).toBe('cursor2')
  })

  it('falls back to empty/false when repository is null', async () => {
    vi.mocked(githubGraphql).mockResolvedValue({ repository: null })

    const result = await fetchRepoPullRequests(TOKEN, 'octo', 'repo')

    expect(result).toEqual({ pullRequests: [], totalCount: 0, hasNextPage: false, endCursor: null })
  })
})

describe('fetchRepoProjects', () => {
  it('passes through projectsV2 nodes as-is', async () => {
    vi.mocked(githubGraphql).mockResolvedValue({
      repository: {
        projectsV2: {
          totalCount: 1,
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [{ id: 'proj1', title: 'Roadmap', number: 1, url: 'u', shortDescription: null, closed: false }],
        },
      },
    })

    const result = await fetchRepoProjects(TOKEN, 'octo', 'repo')

    expect(result.projects).toEqual([{ id: 'proj1', title: 'Roadmap', number: 1, url: 'u', shortDescription: null, closed: false }])
  })

  it('falls back to empty/false when repository is null', async () => {
    vi.mocked(githubGraphql).mockResolvedValue({ repository: null })

    const result = await fetchRepoProjects(TOKEN, 'octo', 'repo')

    expect(result).toEqual({ projects: [], totalCount: 0, hasNextPage: false, endCursor: null })
  })
})
