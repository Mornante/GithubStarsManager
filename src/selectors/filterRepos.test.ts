import { describe, expect, it } from 'vitest'
import { filterRepos, sortRepos } from './filterRepos'
import type { FilterPredicateCtx, FilterState } from '../types/filters'
import type { Repo, StarList } from '../types/github'

function makeRepo(overrides: Partial<Repo> & Pick<Repo, 'id' | 'name'>): Repo {
  return {
    nameWithOwner: `acme/${overrides.name}`,
    owner: { login: 'acme', avatarUrl: '' },
    description: null,
    url: '',
    homepageUrl: null,
    sshUrl: '',
    stargazerCount: 0,
    forkCount: 0,
    updatedAt: '2024-01-01T00:00:00Z',
    starredAt: '2024-01-01T00:00:00Z',
    primaryLanguage: null,
    licenseInfo: null,
    topics: [],
    listIds: [],
    ...overrides,
  }
}

const repoA = makeRepo({
  id: 'r1',
  name: 'alpha',
  primaryLanguage: { name: 'TypeScript', color: null },
  topics: ['cli', 'tool'],
  licenseInfo: { spdxId: 'MIT', name: 'MIT License' },
  stargazerCount: 100,
  updatedAt: '2024-01-01',
  starredAt: '2024-03-01',
})

const repoB = makeRepo({
  id: 'r2',
  name: 'beta',
  primaryLanguage: { name: 'Python', color: null },
  topics: ['web'],
  licenseInfo: { spdxId: 'Apache-2.0', name: 'Apache License 2.0' },
  listIds: ['list1'],
  stargazerCount: 300,
  updatedAt: '2024-02-01',
  starredAt: '2024-01-01',
})

const repoC = makeRepo({
  id: 'r3',
  name: 'gamma',
  primaryLanguage: { name: 'TypeScript', color: null },
  topics: [],
  licenseInfo: null,
  stargazerCount: 200,
  updatedAt: '2024-03-01',
  starredAt: '2024-02-01',
})

const repos = [repoA, repoB, repoC]

const lists: StarList[] = [{ id: 'list1', name: 'Cool Stuff', description: null, isPrivate: false, repoIds: ['r2'] }]

function ctx(overrides: Partial<FilterPredicateCtx> = {}): FilterPredicateCtx {
  return { lists, reviewTags: {}, deployments: {}, ...overrides }
}

function filter(filterState: FilterState, c = ctx()) {
  return filterRepos(repos, filterState, c).map((r) => r.id)
}

describe('filterRepos', () => {
  it('applies no filtering when filterState is empty', () => {
    expect(filter({})).toEqual(['r1', 'r2', 'r3'])
  })

  it('filters by search text, case-insensitively', () => {
    expect(filter({ q: 'AL' })).toEqual(['r1'])
  })

  it('filters by language', () => {
    expect(filter({ language: ['TypeScript'] })).toEqual(['r1', 'r3'])
  })

  it('filters by topic', () => {
    expect(filter({ topic: ['web'] })).toEqual(['r2'])
  })

  it('filters by license', () => {
    expect(filter({ license: ['MIT'] })).toEqual(['r1'])
  })

  it('filters by star list membership', () => {
    expect(filter({ list: 'list1' })).toEqual(['r2'])
  })

  it('filters by review stage', () => {
    const c = ctx({ reviewTags: { r1: 'REVIEW_REQUIRED' } })
    expect(filter({ reviewStage: 'REVIEW_REQUIRED' }, c)).toEqual(['r1'])
  })

  it('filters unsorted repos (no list membership)', () => {
    expect(filter({ unsorted: 'yes' })).toEqual(['r1', 'r3'])
    expect(filter({ unsorted: 'no' })).toEqual(['r2'])
  })

  it('filters untagged repos (no review stage)', () => {
    const c = ctx({ reviewTags: { r1: 'REVIEW_REQUIRED' } })
    expect(filter({ untagged: 'yes' }, c)).toEqual(['r2', 'r3'])
  })

  it('filters "tagged, not categorized" repos, ignoring legacy tag lists', () => {
    const c = ctx({ reviewTags: { r1: 'REVIEW_REQUIRED' } })
    expect(filter({ uncategorized: 'yes' }, c)).toEqual(['r1'])
  })

  it('filters deployed repos', () => {
    const c = ctx({ deployments: { r2: { environment: 'production', deployedRef: 'v1', deployedRefType: 'release', deployedAt: '2024-01-01' } } })
    expect(filter({ deployed: 'yes' }, c)).toEqual(['r2'])
  })
})

describe('sortRepos', () => {
  it('sorts by star count descending', () => {
    expect(sortRepos(repos, 'stars').map((r) => r.id)).toEqual(['r2', 'r3', 'r1'])
  })

  it('sorts by most recently updated', () => {
    expect(sortRepos(repos, 'updated').map((r) => r.id)).toEqual(['r3', 'r2', 'r1'])
  })

  it('sorts by most recently starred', () => {
    expect(sortRepos(repos, 'starred').map((r) => r.id)).toEqual(['r1', 'r3', 'r2'])
  })

  it('sorts by name ascending', () => {
    expect(sortRepos(repos, 'name').map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('does not mutate the input array', () => {
    const original = [...repos]
    sortRepos(repos, 'stars')
    expect(repos).toEqual(original)
  })
})
