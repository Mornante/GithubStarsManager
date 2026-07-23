import { create } from 'zustand'
import { searchRepositories, SEARCH_PAGE_SIZE, type SearchRepoResult } from '../api/rest'
import { windowToCreatedCutoff, type TrendingWindow } from '../utils/dateWindows'

type TrendingStatus = 'idle' | 'loading' | 'loadingMore' | 'error'

interface TrendingState {
  results: SearchRepoResult[]
  language: string | null
  window: TrendingWindow
  page: number
  hasMore: boolean
  status: TrendingStatus
  error: string | null
  setLanguage: (language: string | null) => void
  setWindow: (window: TrendingWindow) => void
  fetch: (token: string) => Promise<void>
  fetchMore: (token: string) => Promise<void>
}

// Guards against out-of-order responses: switching language/window fires a
// new fetch, and if an earlier request resolves after a later one, only the
// most recently issued request may write to state.
let latestFetchRequestId = 0

export const useTrendingStore = create<TrendingState>()((set, get) => ({
  results: [],
  language: null,
  window: 'week',
  page: 1,
  hasMore: false,
  status: 'idle',
  error: null,

  setLanguage: (language) => set({ language }),
  setWindow: (window) => set({ window }),

  fetch: async (token) => {
    const requestId = ++latestFetchRequestId
    set({ status: 'loading', error: null })
    try {
      const { language, window } = get()
      const { items, totalCount } = await searchRepositories(token, {
        createdAfter: windowToCreatedCutoff(window),
        language: language ?? undefined,
        page: 1,
      })
      if (requestId !== latestFetchRequestId) return
      set({ results: items, page: 1, hasMore: items.length < totalCount, status: 'idle' })
    } catch (err) {
      if (requestId !== latestFetchRequestId) return
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load trending repos' })
    }
  },

  fetchMore: async (token) => {
    const { status, hasMore, page, language, window, results } = get()
    if (status === 'loading' || status === 'loadingMore' || !hasMore) return

    const requestId = ++latestFetchRequestId
    set({ status: 'loadingMore', error: null })
    try {
      const nextPage = page + 1
      const { items, totalCount } = await searchRepositories(token, {
        createdAfter: windowToCreatedCutoff(window),
        language: language ?? undefined,
        page: nextPage,
      })
      if (requestId !== latestFetchRequestId) return
      const seen = new Set(results.map((r) => r.id))
      const merged = [...results, ...items.filter((r) => !seen.has(r.id))]
      set({
        results: merged,
        page: nextPage,
        hasMore: merged.length < totalCount && items.length === SEARCH_PAGE_SIZE,
        status: 'idle',
      })
    } catch (err) {
      if (requestId !== latestFetchRequestId) return
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load more trending repos' })
    }
  },
}))
