import { useEffect, useState } from 'react'

// Generic "fetch something, ignore the result if unmounted or superseded"
// hook — the shape hand-rolled with a local `cancelled` flag in several
// components. Pass `null` for `fetcher` to skip fetching (e.g. while a
// prerequisite value isn't ready yet).
//
// `deps` intentionally isn't `fetcher` itself: callers typically pass a fresh
// closure every render, so the effect re-runs based on the caller-supplied
// dependency list instead (same trade-off the original hand-rolled effects made).
export function useAsync<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[],
): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(fetcher !== null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is caller-supplied by design; see note above.
  useEffect(() => {
    if (!fetcher) {
      setData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetcher()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is intentionally caller-supplied, not a literal.
  }, deps)

  return { data, loading }
}
