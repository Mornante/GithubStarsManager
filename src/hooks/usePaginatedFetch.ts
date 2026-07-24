import { useCallback, useEffect, useState } from 'react'

export interface PageResult<T> {
  items: T[]
  hasNextPage: boolean
  endCursor: string | null
}

type Status = 'loading' | 'loadingMore' | 'idle' | 'error'

// Generic "fetch a page, then load more on demand" hook — the shape
// hand-rolled once for org repositories, now needed for org projects and org
// members too. `deps` (not `fetchPage`) controls when the first page
// re-fetches — same trade-off as useAsync.ts: callers typically pass a fresh
// closure every render, so keying off the fetcher's identity would defeat
// the point.
export function usePaginatedFetch<T>(fetchPage: (cursor: string | null) => Promise<PageResult<T>>, deps: unknown[]) {
  const [items, setItems] = useState<T[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is intentionally caller-supplied, not a literal.
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setItems([])
    fetchPage(null)
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setCursor(result.endCursor)
        setHasMore(result.hasNextPage)
        setStatus('idle')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is intentionally caller-supplied, not a literal.
  }, deps)

  const loadMore = useCallback(() => {
    if (status === 'loading' || status === 'loadingMore' || !hasMore) return
    setStatus('loadingMore')
    fetchPage(cursor)
      .then((result) => {
        setItems((prev) => [...prev, ...result.items])
        setCursor(result.endCursor)
        setHasMore(result.hasNextPage)
        setStatus('idle')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load more')
        setStatus('error')
      })
  }, [cursor, hasMore, status, fetchPage])

  return { items, status, error, hasMore, loadMore }
}
