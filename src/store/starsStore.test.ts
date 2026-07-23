import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repo, StarList } from '../types/github'

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware')
  // Strip persistence in tests: the store's own logic is under test, not
  // localStorage plumbing, and this avoids needing a DOM environment for it.
  return { ...actual, persist: (config: unknown) => config }
})

vi.mock('../api/pagination', () => ({ fetchAllStarredRepos: vi.fn() }))
vi.mock('../api/listsApi', () => ({
  fetchViewerLists: vi.fn(),
  createList: vi.fn(),
  updateRepoListMembership: vi.fn(),
}))
vi.mock('../api/rest', () => ({
  getRepoDetails: vi.fn(),
  starRepo: vi.fn(),
  unstarRepo: vi.fn(),
}))

import { fetchAllStarredRepos } from '../api/pagination'
import { fetchViewerLists, updateRepoListMembership } from '../api/listsApi'
import { unstarRepo as unstarRepoApi } from '../api/rest'
import { useStarsStore } from './starsStore'

function repo(overrides: Partial<Repo> & Pick<Repo, 'id' | 'name'>): Repo {
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

function list(overrides: Partial<StarList> & Pick<StarList, 'id' | 'name'>): StarList {
  return { description: null, isPrivate: false, repoIds: [], ...overrides }
}

const USER_ID = 'u1'
const TOKEN = 'token'

beforeEach(() => {
  vi.clearAllMocks()
  useStarsStore.setState({ dataByUser: {}, status: 'idle', error: null })
})

describe('addToList', () => {
  it('optimistically adds the repo to the list, then persists it', async () => {
    const repoA = repo({ id: 'r1', name: 'alpha' })
    const listX = list({ id: 'l1', name: 'Cool Stuff' })
    useStarsStore.setState({ dataByUser: { [USER_ID]: { repos: [repoA], lists: [listX], lastSyncedAt: null } } })
    vi.mocked(updateRepoListMembership).mockResolvedValue(undefined)

    await useStarsStore.getState().addToList(USER_ID, TOKEN, 'r1', 'l1')

    const data = useStarsStore.getState().dataByUser[USER_ID]
    expect(data.repos[0].listIds).toEqual(['l1'])
    expect(data.lists[0].repoIds).toEqual(['r1'])
    expect(updateRepoListMembership).toHaveBeenCalledWith(TOKEN, 'r1', ['l1'])
  })

  it('rolls back the optimistic update when the API call fails', async () => {
    const repoA = repo({ id: 'r1', name: 'alpha' })
    const listX = list({ id: 'l1', name: 'Cool Stuff' })
    useStarsStore.setState({ dataByUser: { [USER_ID]: { repos: [repoA], lists: [listX], lastSyncedAt: null } } })
    vi.mocked(updateRepoListMembership).mockRejectedValue(new Error('network down'))

    await useStarsStore.getState().addToList(USER_ID, TOKEN, 'r1', 'l1')

    const data = useStarsStore.getState().dataByUser[USER_ID]
    expect(data.repos[0].listIds).toEqual([])
    expect(data.lists[0].repoIds).toEqual([])
    expect(useStarsStore.getState().error).toBe('network down')
  })

  it('is a no-op when the repo is already a member of the list', async () => {
    const repoA = repo({ id: 'r1', name: 'alpha', listIds: ['l1'] })
    const listX = list({ id: 'l1', name: 'Cool Stuff', repoIds: ['r1'] })
    useStarsStore.setState({ dataByUser: { [USER_ID]: { repos: [repoA], lists: [listX], lastSyncedAt: null } } })

    await useStarsStore.getState().addToList(USER_ID, TOKEN, 'r1', 'l1')

    expect(updateRepoListMembership).not.toHaveBeenCalled()
  })
})

describe('unstarRepo', () => {
  it('optimistically removes the repo everywhere, then persists it', async () => {
    const repoA = repo({ id: 'r1', name: 'alpha', listIds: ['l1'] })
    const listX = list({ id: 'l1', name: 'Cool Stuff', repoIds: ['r1'] })
    useStarsStore.setState({ dataByUser: { [USER_ID]: { repos: [repoA], lists: [listX], lastSyncedAt: null } } })
    vi.mocked(unstarRepoApi).mockResolvedValue(undefined)

    await useStarsStore.getState().unstarRepo(USER_ID, TOKEN, 'r1', 'acme', 'alpha')

    const data = useStarsStore.getState().dataByUser[USER_ID]
    expect(data.repos).toEqual([])
    expect(data.lists[0].repoIds).toEqual([])
  })

  it('restores the repo when the API call fails', async () => {
    const repoA = repo({ id: 'r1', name: 'alpha', listIds: ['l1'] })
    const listX = list({ id: 'l1', name: 'Cool Stuff', repoIds: ['r1'] })
    useStarsStore.setState({ dataByUser: { [USER_ID]: { repos: [repoA], lists: [listX], lastSyncedAt: null } } })
    vi.mocked(unstarRepoApi).mockRejectedValue(new Error('403'))

    await useStarsStore.getState().unstarRepo(USER_ID, TOKEN, 'r1', 'acme', 'alpha')

    const data = useStarsStore.getState().dataByUser[USER_ID]
    expect(data.repos).toEqual([repoA])
    expect(data.lists).toEqual([listX])
    expect(useStarsStore.getState().error).toBe('403')
  })
})

describe('refresh', () => {
  it('keeps the previous lists when only the lists fetch fails', async () => {
    const repoA = repo({ id: 'r1', name: 'alpha' })
    const listX = list({ id: 'l1', name: 'Cool Stuff' })
    useStarsStore.setState({ dataByUser: { [USER_ID]: { repos: [], lists: [listX], lastSyncedAt: null } } })
    vi.mocked(fetchAllStarredRepos).mockResolvedValue([repoA])
    vi.mocked(fetchViewerLists).mockRejectedValue(new Error('missing read:org scope'))

    await useStarsStore.getState().refresh(USER_ID, TOKEN)

    const data = useStarsStore.getState().dataByUser[USER_ID]
    expect(data.repos.map((r) => r.id)).toEqual(['r1'])
    expect(data.lists).toEqual([listX])
    expect(useStarsStore.getState().status).toBe('error')
    expect(useStarsStore.getState().error).toBe('missing read:org scope')
  })
})
