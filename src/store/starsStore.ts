import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchAllStarredRepos } from '../api/pagination'
import { createList as createListApi, fetchViewerLists, updateRepoListMembership } from '../api/listsApi'
import { getRepoDetails, starRepo as starRepoApi, unstarRepo as unstarRepoApi } from '../api/rest'
import { useToastStore } from './toastStore'
import type { Repo, StarList } from '../types/github'

interface UserData {
  repos: Repo[]
  lists: StarList[]
  lastSyncedAt: string | null
}

type SyncStatus = 'idle' | 'syncing' | 'error'

interface StarsState {
  dataByUser: Record<string, UserData>
  status: SyncStatus
  error: string | null
  refresh: (userId: string, token: string) => Promise<void>
  addToList: (userId: string, token: string, repoId: string, listId: string) => Promise<void>
  removeFromList: (userId: string, token: string, repoId: string, listId: string) => Promise<void>
  createList: (userId: string, token: string, name: string, description?: string) => Promise<void>
  starRepo: (userId: string, token: string, owner: string, name: string) => Promise<void>
  unstarRepo: (userId: string, token: string, repoId: string, owner: string, name: string) => Promise<void>
}

const emptyUserData: UserData = { repos: [], lists: [], lastSyncedAt: null }

function toast(message: string) {
  useToastStore.getState().show(message)
}

function withListMembership(repos: Repo[], lists: StarList[]): Repo[] {
  const listIdsByRepo = new Map<string, string[]>()
  for (const list of lists) {
    for (const repoId of list.repoIds) {
      const existing = listIdsByRepo.get(repoId) ?? []
      existing.push(list.id)
      listIdsByRepo.set(repoId, existing)
    }
  }
  return repos.map((repo) => ({ ...repo, listIds: listIdsByRepo.get(repo.id) ?? [] }))
}

export const useStarsStore = create<StarsState>()(
  persist(
    (set, get) => ({
      dataByUser: {},
      status: 'idle',
      error: null,

      refresh: async (userId, token) => {
        set({ status: 'syncing', error: null })
        const before = get().dataByUser[userId] ?? emptyUserData

        // Fetched independently: a lists failure (e.g. missing scope) shouldn't
        // also block the repos sync, and vice versa.
        const [reposResult, listsResult] = await Promise.allSettled([
          fetchAllStarredRepos(token),
          fetchViewerLists(token),
        ])

        const repos = reposResult.status === 'fulfilled' ? reposResult.value : before.repos
        const lists = listsResult.status === 'fulfilled' ? listsResult.value : before.lists

        const failure =
          reposResult.status === 'rejected'
            ? reposResult.reason
            : listsResult.status === 'rejected'
              ? listsResult.reason
              : null

        set((state) => ({
          dataByUser: {
            ...state.dataByUser,
            [userId]: {
              repos: withListMembership(repos, lists),
              lists,
              lastSyncedAt: new Date().toISOString(),
            },
          },
          status: failure ? 'error' : 'idle',
          error: failure
            ? failure instanceof Error
              ? failure.message
              : 'Failed to refresh from GitHub'
            : null,
        }))
      },

      addToList: async (userId, token, repoId, listId) => {
        const before = get().dataByUser[userId] ?? emptyUserData
        const repo = before.repos.find((r) => r.id === repoId)
        if (!repo || repo.listIds.includes(listId)) return
        const nextListIds = [...repo.listIds, listId]
        const listName = before.lists.find((l) => l.id === listId)?.name ?? 'list'

        const optimistic: UserData = {
          ...before,
          repos: before.repos.map((r) => (r.id === repoId ? { ...r, listIds: nextListIds } : r)),
          lists: before.lists.map((l) => (l.id === listId ? { ...l, repoIds: [...l.repoIds, repoId] } : l)),
        }
        set((state) => ({ dataByUser: { ...state.dataByUser, [userId]: optimistic } }))

        try {
          await updateRepoListMembership(token, repoId, nextListIds)
          toast(`Added ${repo.name} to ${listName}`)
        } catch (err) {
          set((state) => ({
            dataByUser: { ...state.dataByUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to add repo to list',
          }))
        }
      },

      removeFromList: async (userId, token, repoId, listId) => {
        const before = get().dataByUser[userId] ?? emptyUserData
        const repo = before.repos.find((r) => r.id === repoId)
        if (!repo || !repo.listIds.includes(listId)) return
        const nextListIds = repo.listIds.filter((id) => id !== listId)
        const listName = before.lists.find((l) => l.id === listId)?.name ?? 'list'

        const optimistic: UserData = {
          ...before,
          repos: before.repos.map((r) => (r.id === repoId ? { ...r, listIds: nextListIds } : r)),
          lists: before.lists.map((l) =>
            l.id === listId ? { ...l, repoIds: l.repoIds.filter((id) => id !== repoId) } : l,
          ),
        }
        set((state) => ({ dataByUser: { ...state.dataByUser, [userId]: optimistic } }))

        try {
          await updateRepoListMembership(token, repoId, nextListIds)
          toast(`Removed ${repo.name} from ${listName}`)
        } catch (err) {
          set((state) => ({
            dataByUser: { ...state.dataByUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to remove repo from list',
          }))
        }
      },

      createList: async (userId, token, name, description) => {
        try {
          const newList = await createListApi(token, name, description)
          set((state) => {
            const before = state.dataByUser[userId] ?? emptyUserData
            return {
              dataByUser: { ...state.dataByUser, [userId]: { ...before, lists: [...before.lists, newList] } },
            }
          })
        } catch (err) {
          set({ error: err instanceof Error ? err.message : `Failed to create list "${name}"` })
        }
      },

      starRepo: async (userId, token, owner, name) => {
        try {
          await starRepoApi(token, owner, name)
          const repo = await getRepoDetails(token, owner, name)
          set((state) => {
            const current = state.dataByUser[userId] ?? emptyUserData
            if (current.repos.some((r) => r.id === repo.id)) return {}
            return {
              dataByUser: { ...state.dataByUser, [userId]: { ...current, repos: [repo, ...current.repos] } },
            }
          })
          toast(`Starred ${owner}/${name}`)
        } catch (err) {
          set({ error: err instanceof Error ? err.message : `Failed to star ${owner}/${name}` })
        }
      },

      unstarRepo: async (userId, token, repoId, owner, name) => {
        const before = get().dataByUser[userId] ?? emptyUserData
        const optimistic: UserData = {
          ...before,
          repos: before.repos.filter((r) => r.id !== repoId),
          lists: before.lists.map((l) => ({ ...l, repoIds: l.repoIds.filter((id) => id !== repoId) })),
        }
        set((state) => ({ dataByUser: { ...state.dataByUser, [userId]: optimistic } }))

        try {
          await unstarRepoApi(token, owner, name)
          toast(`Unstarred ${owner}/${name}`)
        } catch (err) {
          set((state) => ({
            dataByUser: { ...state.dataByUser, [userId]: before },
            error: err instanceof Error ? err.message : `Failed to unstar ${owner}/${name}`,
          }))
        }
      },
    }),
    { name: 'gh-stars-data' },
  ),
)

export function useUserData(userId: string | null): UserData {
  return useStarsStore((state) => (userId ? (state.dataByUser[userId] ?? emptyUserData) : emptyUserData))
}
