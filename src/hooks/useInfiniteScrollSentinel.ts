import { useEffect, useRef } from 'react'

// Attach the returned ref to a sentinel element at the bottom of a list;
// onIntersect fires once it scrolls near the viewport. Pass a stable
// (useCallback'd) onIntersect to avoid re-creating the observer every render.
export function useInfiniteScrollSentinel(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect()
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, enabled])

  return ref
}
