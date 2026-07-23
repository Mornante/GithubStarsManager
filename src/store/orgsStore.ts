import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  fetchOrgViewerIsFollowing,
  followOrganization,
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
}

function toast(message: string) {
  useToastStore.getState().show(message)
}

function patchOrgEverywhere(results: Organization[], orgId: string, patch: Partial<Organization>): Organization[] {
  return results.map((o) => (o.id === orgId ? { ...o, ...patch } : o))
}

// REST search can't report per-viewer follow state, so newly-fetched results
// default to false — patch in "true" for any org already known to be followed
// through this app before rendering them.
function reconcileFollowState(organizations: Organization[], followed: Record<string, Organization>): Organization[] {
  return organizations.map((org) => (followed[org.id] ? { ...org, viewerIsFollowing: true } : org))
}

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
        set({ status: 'loading', error: null, query })
        try {
          const { organizations, hasNextPage, endCursor } = await searchOrganizations(token, query)
          const followed = get().followedByUser[userId] ?? {}
          set({ results: reconcileFollowState(organizations, followed), cursor: endCursor, hasMore: hasNextPage, status: 'idle' })
        } catch (err) {
          set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to search organizations' })
        }
      },

      searchMore: async (userId, token) => {
        const { status, hasMore, cursor, query, results } = get()
        if (status === 'loading' || status === 'loadingMore' || !hasMore) return
        set({ status: 'loadingMore', error: null })
        try {
          const { organizations, hasNextPage, endCursor } = await searchOrganizations(token, query, cursor)
          const followed = get().followedByUser[userId] ?? {}
          set({
            results: [...results, ...reconcileFollowState(organizations, followed)],
            cursor: endCursor,
            hasMore: hasNextPage,
            status: 'idle',
          })
        } catch (err) {
          set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load more organizations' })
        }
      },

      follow: async (userId, token, org) => {
        set((state) => ({ results: patchOrgEverywhere(state.results, org.id, { viewerIsFollowing: true }) }))
        try {
          await followOrganization(token, org.id)
          set((state) => ({
            followedByUser: {
              ...state.followedByUser,
              [userId]: { ...(state.followedByUser[userId] ?? {}), [org.id]: { ...org, viewerIsFollowing: true } },
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
              [userId]: { ...(state.followedByUser[userId] ?? {}), [org.id]: { ...org, viewerIsFollowing: true } },
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
                  [userId]: { ...(state.followedByUser[userId] ?? {}), [org.id]: { ...org, viewerIsFollowing: true } },
                }
              : state.followedByUser,
          }))
        } catch {
          // Best-effort — keep whatever we already had if this check fails.
        }
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
  const followedMap = useOrgsStore((state) => (userId ? (state.followedByUser[userId] ?? EMPTY_FOLLOWED) : EMPTY_FOLLOWED))
  return useMemo(() => Object.values(followedMap), [followedMap])
}
