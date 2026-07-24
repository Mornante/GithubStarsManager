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
  getOrgDetails: vi.fn(),
}))

import { fetchOrgViewerIsFollowing, getOrgDetails, searchOrganizations } from '../api/orgsApi'
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

describe('enrichOrgProfiles', () => {
  it('fills in follower count, location, and website for orgs missing them', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    useOrgsStore.setState({ results: [orgA] })
    vi.mocked(getOrgDetails).mockResolvedValue({
      ...orgA,
      followerCount: 500,
      location: 'Internet',
      websiteUrl: 'https://org-a.example.com',
      repoCount: 12,
      name: 'Org A',
      description: 'A description',
    })

    await useOrgsStore.getState().enrichOrgProfiles(USER_ID, TOKEN, [orgA])

    const enriched = useOrgsStore.getState().results.find((o) => o.id === 'o1')
    expect(enriched).toMatchObject({
      followerCount: 500,
      location: 'Internet',
      websiteUrl: 'https://org-a.example.com',
      repoCount: 12,
      name: 'Org A',
      description: 'A description',
    })
  })

  it('also enriches the cached "Following" copy when the org is already followed', async () => {
    const orgA = org({ id: 'o1', login: 'org-a', viewerIsFollowing: true })
    useOrgsStore.setState({ followedByUser: { [USER_ID]: { o1: orgA } } })
    vi.mocked(getOrgDetails).mockResolvedValue({ ...orgA, followerCount: 42 })

    await useOrgsStore.getState().enrichOrgProfiles(USER_ID, TOKEN, [orgA])

    expect(useOrgsStore.getState().followedByUser[USER_ID].o1.followerCount).toBe(42)
  })

  it('skips orgs that already have a follower count, without re-fetching them', async () => {
    const orgA = org({ id: 'o1', login: 'org-a', followerCount: 10 })

    await useOrgsStore.getState().enrichOrgProfiles(USER_ID, TOKEN, [orgA])

    expect(getOrgDetails).not.toHaveBeenCalled()
  })

  it('leaves an org unchanged when its enrichment fetch fails', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    useOrgsStore.setState({ results: [orgA] })
    vi.mocked(getOrgDetails).mockRejectedValue(new Error('network error'))

    await useOrgsStore.getState().enrichOrgProfiles(USER_ID, TOKEN, [orgA])

    expect(useOrgsStore.getState().results.find((o) => o.id === 'o1')).toEqual(orgA)
  })
})

describe('search', () => {
  it('kicks off background discovery and profile enrichment for the fetched results', async () => {
    const orgA = org({ id: 'o1', login: 'org-a' })
    vi.mocked(searchOrganizations).mockResolvedValue({ organizations: [orgA], hasNextPage: false, endCursor: null })
    vi.mocked(fetchOrgViewerIsFollowing).mockResolvedValue(true)
    vi.mocked(getOrgDetails).mockResolvedValue({ ...orgA, followerCount: 7 })

    await useOrgsStore.getState().search(USER_ID, TOKEN, '')

    await vi.waitFor(() => {
      expect(useOrgsStore.getState().followedByUser[USER_ID]).toEqual({ o1: { ...orgA, viewerIsFollowing: true } })
      expect(useOrgsStore.getState().results.find((o) => o.id === 'o1')?.followerCount).toBe(7)
    })
  })
})
