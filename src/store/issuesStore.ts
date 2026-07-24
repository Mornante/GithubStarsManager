import { create } from 'zustand'
import { searchMyIssues, type Issue } from '../api/issuesApi'
import { SEARCH_PAGE_SIZE } from '../api/rest'

type IssuesStatus = 'idle' | 'loading' | 'loadingMore' | 'error'

interface IssuesState {
  query: string
  results: Issue[]
  page: number
  hasMore: boolean
  status: IssuesStatus
  error: string | null
  setQuery: (query: string) => void
  search: (token: string) => Promise<void>
  searchMore: (token: string) => Promise<void>
}

// Guards against out-of-order responses: a new search fires on every debounced
// keystroke, and if an earlier request resolves after a later one, only the
// most recently issued request may write to state.
let latestIssuesRequestId = 0

export const useIssuesStore = create<IssuesState>()((set, get) => ({
  query: '',
  results: [],
  page: 1,
  hasMore: false,
  status: 'idle',
  error: null,

  setQuery: (query) => set({ query }),

  search: async (token) => {
    const requestId = ++latestIssuesRequestId
    set({ status: 'loading', error: null })
    try {
      const { query } = get()
      const { issues, totalCount } = await searchMyIssues(token, query, 1)
      if (requestId !== latestIssuesRequestId) return
      set({ results: issues, page: 1, hasMore: issues.length < totalCount, status: 'idle' })
    } catch (err) {
      if (requestId !== latestIssuesRequestId) return
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load issues' })
    }
  },

  searchMore: async (token) => {
    const { status, hasMore, page, query, results } = get()
    if (status === 'loading' || status === 'loadingMore' || !hasMore) return

    const requestId = ++latestIssuesRequestId
    set({ status: 'loadingMore', error: null })
    try {
      const nextPage = page + 1
      const { issues, totalCount } = await searchMyIssues(token, query, nextPage)
      if (requestId !== latestIssuesRequestId) return
      const seen = new Set(results.map((i) => i.id))
      const merged = [...results, ...issues.filter((i) => !seen.has(i.id))]
      set({
        results: merged,
        page: nextPage,
        hasMore: merged.length < totalCount && issues.length === SEARCH_PAGE_SIZE,
        status: 'idle',
      })
    } catch (err) {
      if (requestId !== latestIssuesRequestId) return
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load more issues' })
    }
  },
}))
