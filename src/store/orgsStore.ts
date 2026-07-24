import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  fetchOrgViewerIsFollowing,
  followOrganization,
  getOrgDetails,
  searchOrganizations,
  unfollowOrganization,
} from '../api/orgsApi'
import { useToastStore } from './toastStore'
import type { Organization } from '../types/github'

type SearchStatus = 'idle' | 'loading' | 'loadingMore' | 'error'

interface OrgsState {
  // Orgs followed *through this app* — GitHub's API has no way to list all
  // organizations a viewer follows, only to check/toggle a single org at a time.
  followedByUser: Record<string, Record<string, Organization>>

  query: string
  results: Organization[]
  cursor: string | null
  hasMore: boolean
  status: SearchStatus
  error: string | null

  setQuery: (query: string) => void
  search: (userId: string, token: string, query: string) => Promise<void>
  searchMore: (userId: string, token: string) => Promise<void>
  follow: (userId: string, token: string, org: Organization) => Promise<void>
  unfollow: (userId: string, token: string, org: Organization) => Promise<void>
  syncFollowStatus: (userId: string, token: string, org: Organization) => Promise<void>
  discoverFollowedAmong: (userId: string, token: string, organizations: Organization[]) => Promise<void>
  enrichOrgProfiles: (userId: string, token: string, organizations: Organization[]) => Promise<void>
}

function toast(message: string) {
  useToastStore.getState().show(message)
}

function patchOrgEverywhere(
  results: Organization[],
  orgId: string,
  patch: Partial<Organization>,
): Organization[] {
  return results.map((o) => (o.id === orgId ? { ...o, ...patch } : o))
}

// REST search can't report per-viewer follow state, so newly-fetched results
// default to false — patch in "true" for any org already known to be followed
// through this app before rendering them.
function reconcileFollowState(
  organizations: Organization[],
  followed: Record<string, Organization>,
): Organization[] {
  return organizations.map((org) => (followed[org.id] ? { ...org, viewerIsFollowing: true } : org))
}

// Shared by search/searchMore: if requests resolve out of order (e.g. a slow
// early keystroke's response lands after a later one), only the response
// matching the most recently issued request is allowed to update state.
let latestSearchRequestId = 0

export const useOrgsStore = create<OrgsState>()(
  persist(
    (set, get) => ({
      followedByUser: {},

      query: '',
      results: [],
      cursor: null,
      hasMore: false,
      status: 'idle',
      error: null,

      setQuery: (query) => set({ query }),

      search: async (userId, token, query) => {
        const requestId = ++latestSearchRequestId
        set({ status: 'loading', error: null, query })
        try {
          const { organizations, hasNextPage, endCursor } = await searchOrganizations(token, query)
          if (requestId !== latestSearchRequestId) return
          const followed = get().followedByUser[userId] ?? {}
          set({
            results: reconcileFollowState(organizations, followed),
            cursor: endCursor,
            hasMore: hasNextPage,
            status: 'idle',
          })
          void get().discoverFollowedAmong(userId, token, organizations)
          void get().enrichOrgProfiles(userId, token, organizations)
        } catch (err) {
          if (requestId !== latestSearchRequestId) return
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to search organizations',
          })
        }
      },

      searchMore: async (userId, token) => {
        const { status, hasMore, cursor, query, results } = get()
        if (status === 'loading' || status === 'loadingMore' || !hasMore) return
        const requestId = ++latestSearchRequestId
        set({ status: 'loadingMore', error: null })
        try {
          const { organizations, hasNextPage, endCursor } = await searchOrganizations(token, query, cursor)
          if (requestId !== latestSearchRequestId) return
          const followed = get().followedByUser[userId] ?? {}
          set({
            results: [...results, ...reconcileFollowState(organizations, followed)],
            cursor: endCursor,
            hasMore: hasNextPage,
            status: 'idle',
          })
          void get().discoverFollowedAmong(userId, token, organizations)
          void get().enrichOrgProfiles(userId, token, organizations)
        } catch (err) {
          if (requestId !== latestSearchRequestId) return
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to load more organizations',
          })
        }
      },

      follow: async (userId, token, org) => {
        set((state) => ({ results: patchOrgEverywhere(state.results, org.id, { viewerIsFollowing: true }) }))
        try {
          await followOrganization(token, org.id)
          set((state) => ({
            followedByUser: {
              ...state.followedByUser,
              [userId]: {
                ...(state.followedByUser[userId] ?? {}),
                [org.id]: { ...org, viewerIsFollowing: true },
              },
            },
          }))
          toast(`Followed ${org.login}`)
        } catch (err) {
          set((state) => ({
            results: patchOrgEverywhere(state.results, org.id, { viewerIsFollowing: false }),
            error: err instanceof Error ? err.message : `Failed to follow ${org.login}`,
          }))
        }
      },

      unfollow: async (userId, token, org) => {
        set((state) => {
          const remaining = { ...(state.followedByUser[userId] ?? {}) }
          delete remaining[org.id]
          return {
            results: patchOrgEverywhere(state.results, org.id, { viewerIsFollowing: false }),
            followedByUser: { ...state.followedByUser, [userId]: remaining },
          }
        })
        try {
          await unfollowOrganization(token, org.id)
          toast(`Unfollowed ${org.login}`)
        } catch (err) {
          set((state) => ({
            results: patchOrgEverywhere(state.results, org.id, { viewerIsFollowing: true }),
            followedByUser: {
              ...state.followedByUser,
              [userId]: {
                ...(state.followedByUser[userId] ?? {}),
                [org.id]: { ...org, viewerIsFollowing: true },
              },
            },
            error: err instanceof Error ? err.message : `Failed to unfollow ${org.login}`,
          }))
        }
      },

      // Called when an org's detail modal opens. Corrects the locally-guessed
      // follow state (either the REST-search default of false, or a stale local
      // cache entry) against the real value — e.g. orgs followed on github.com
      // directly, outside this app, would otherwise show as "not following" forever.
      syncFollowStatus: async (userId, token, org) => {
        try {
          const real = await fetchOrgViewerIsFollowing(token, org.login)
          if (real === org.viewerIsFollowing) return
          set((state) => ({
            results: patchOrgEverywhere(state.results, org.id, { viewerIsFollowing: real }),
            followedByUser: real
              ? {
                  ...state.followedByUser,
                  [userId]: {
                    ...(state.followedByUser[userId] ?? {}),
                    [org.id]: { ...org, viewerIsFollowing: true },
                  },
                }
              : state.followedByUser,
          }))
        } catch {
          // Best-effort — keep whatever we already had if this check fails.
        }
      },

      // GitHub has no bulk "orgs the viewer follows" endpoint, only a
      // per-org check — so instead of only discovering a followed org when
      // its detail modal happens to be opened, check every org that shows up
      // in a page of search results in the background. Anything confirmed
      // followed gets promoted into followedByUser (and out of "Popular
      // organizations", since OrganizationsPage hides orgs already shown
      // under "Following") without the user needing to click into it first.
      discoverFollowedAmong: async (userId, token, organizations) => {
        const followed = get().followedByUser[userId] ?? {}
        const unknown = organizations.filter((org) => !followed[org.id])
        if (unknown.length === 0) return

        const checks = await Promise.allSettled(
          unknown.map(async (org) => ({
            org,
            isFollowing: await fetchOrgViewerIsFollowing(token, org.login),
          })),
        )
        const newlyFollowed = checks
          .filter(
            (r): r is PromiseFulfilledResult<{ org: Organization; isFollowing: boolean }> =>
              r.status === 'fulfilled' && r.value.isFollowing,
          )
          .map((r) => r.value.org)
        if (newlyFollowed.length === 0) return

        set((state) => ({
          results: newlyFollowed.reduce(
            (acc, org) => patchOrgEverywhere(acc, org.id, { viewerIsFollowing: true }),
            state.results,
          ),
          followedByUser: {
            ...state.followedByUser,
            [userId]: {
              ...(state.followedByUser[userId] ?? {}),
              ...Object.fromEntries(
                newlyFollowed.map((org) => [org.id, { ...org, viewerIsFollowing: true }]),
              ),
            },
          },
        }))
      },

      // Search results never carry follower count / location / website (see
      // the comment on OrgSearchResult) — this fetches the real profile per
      // org in the background via getOrgDetails and patches it in, the same
      // "check everything, patch in whatever resolves" shape as
      // discoverFollowedAmong. Also updates the cached followedByUser copy so
      // an org's "Following" card gets the same enrichment, not just its
      // appearance in search results.
      enrichOrgProfiles: async (userId, token, organizations) => {
        const needsEnrichment = organizations.filter((org) => org.followerCount == null)
        if (needsEnrichment.length === 0) return

        const settled = await Promise.allSettled(
          needsEnrichment.map((org) => getOrgDetails(token, org.login)),
        )

        set((state) => {
          let results = state.results
          const followedForUser = { ...(state.followedByUser[userId] ?? {}) }
          let followedChanged = false

          settled.forEach((outcome, i) => {
            if (outcome.status !== 'fulfilled') return
            const orgId = needsEnrichment[i].id
            const patch: Partial<Organization> = {
              name: outcome.value.name,
              description: outcome.value.description,
              websiteUrl: outcome.value.websiteUrl,
              location: outcome.value.location,
              repoCount: outcome.value.repoCount,
              followerCount: outcome.value.followerCount,
            }
            results = patchOrgEverywhere(results, orgId, patch)
            if (followedForUser[orgId]) {
              followedForUser[orgId] = { ...followedForUser[orgId], ...patch }
              followedChanged = true
            }
          })

          return followedChanged
            ? { results, followedByUser: { ...state.followedByUser, [userId]: followedForUser } }
            : { results }
        })
      },
    }),
    { name: 'gh-stars-orgs', partialize: (state) => ({ followedByUser: state.followedByUser }) },
  ),
)

const EMPTY_FOLLOWED: Record<string, Organization> = {}

export function useFollowedOrgs(userId: string | null): Organization[] {
  // Select the stable nested object first — deriving a new array from it on
  // every call (e.g. inline Object.values in the selector) trips React's
  // useSyncExternalStore infinite-loop guard since the snapshot is never equal.
  const followedMap = useOrgsStore((state) =>
    userId ? (state.followedByUser[userId] ?? EMPTY_FOLLOWED) : EMPTY_FOLLOWED,
  )
  return useMemo(() => Object.values(followedMap), [followedMap])
}
