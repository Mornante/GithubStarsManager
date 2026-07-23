import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Organization } from '../types/github'

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware')
  return { ...actual, persist: (config: unknown) => config }
})

vi.mock('../api/orgsApi', () => ({
  searchOrganizations: vi.fn(),
  fetchOrgViewerIsFollowing: vi.fn(),
  followOrganization: vi.fn(),
  unfollowOrganization: vi.fn(),
}))

import { fetchOrgViewerIsFollowing, searchOrganizations } from '../api/orgsApi'
import { useOrgsStore } from './orgsStore'

const USER_ID = 'u1'
const TOKEN = 'token'

function org(overrides: Partial<Organization> & Pick<Organization, 'id' | 'login'>): Organization {
  return {
    name: null,
    avatarUrl: '',
    description: null,
    url: '',
    websiteUrl: null,
    location: null,
    repoCount: null,
    memberCount: null,
    followerCount: null,
    viewerIsFollowing: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useOrgsStore.setState({
    followedByUser: {},
    query: '',
    results: [],
    cursor: null,
    hasMore: false,
    status: 'idle',
    error: null,
  })
})

describe('discoverFollowedAmong', () => {
  it('promotes orgs confirmed followed into followedByUser, and ignores unfollowed ones', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    const orgB = org({ id: 'o2', login: 'org-b' })
    useOrgsStore.setState({ results: [orgA, orgB] })
    vi.mocked(fetchOrgViewerIsFollowing).mockImplementation(async (_token, login) => login === 'org-a')

    await useOrgsStore.getState().discoverFollowedAmong(USER_ID, TOKEN, [orgA, orgB])

    expect(useOrgsStore.getState().followedByUser[USER_ID]).toEqual({ o1: { ...orgA, viewerIsFollowing: true } })
    expect(useOrgsStore.getState().results.find((o) => o.id === 'o1')?.viewerIsFollowing).toBe(true)
    expect(useOrgsStore.getState().results.find((o) => o.id === 'o2')?.viewerIsFollowing).toBe(false)
  })

  it('skips orgs already known to be followed, without re-checking them', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    useOrgsStore.setState({ followedByUser: { [USER_ID]: { o1: { ...orgA, viewerIsFollowing: true } } } })

    await useOrgsStore.getState().discoverFollowedAmong(USER_ID, TOKEN, [orgA])

    expect(fetchOrgViewerIsFollowing).not.toHaveBeenCalled()
  })

  it('does nothing when the follow check fails', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    vi.mocked(fetchOrgViewerIsFollowing).mockRejectedValue(new Error('network error'))

    await useOrgsStore.getState().discoverFollowedAmong(USER_ID, TOKEN, [orgA])

    expect(useOrgsStore.getState().followedByUser[USER_ID]).toBeUndefined()
  })
})

describe('search', () => {
  it('kicks off background discovery for the fetched results', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    vi.mocked(searchOrganizations).mockResolvedValue({ organizations: [orgA], hasNextPage: false, endCursor: null })
    vi.mocked(fetchOrgViewerIsFollowing).mockResolvedValue(true)

    await useOrgsStore.getState().search(USER_ID, TOKEN, '')

    await vi.waitFor(() => {
      expect(useOrgsStore.getState().followedByUser[USER_ID]).toEqual({ o1: { ...orgA, viewerIsFollowing: true } })
    })
  })
})
