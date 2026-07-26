import { useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../store/gsmStateStore'
import type { RecentItem } from '../types/gsmState'

export function useRecentItems() {
  const account = useAuthStore((s) => s.currentAccount())
  const recordVisitAction = useGsmStateStore((s) => s.recordVisit)
  const clearRecentItemsAction = useGsmStateStore((s) => s.clearRecentItems)
  const items = useGsmUserState(account?.user.id ?? null).state.recentItems

  // Guards against firing the same visit twice from the same mount (e.g.
  // React StrictMode's dev-only double effect invocation) — without this, two
  // overlapping writes for one id can leave a failed write looking like it
  // silently succeeded, since the second rollback restores to a "before" that
  // already has the first call's optimistic entry.
  const lastRecordedIdRef = useRef<string | null>(null)

  const recordVisit = useCallback(
    (item: Omit<RecentItem, 'visitedAt'>) => {
      if (!account || lastRecordedIdRef.current === item.id) return
      lastRecordedIdRef.current = item.id
      void recordVisitAction(account.user.id, account.token, item)
    },
    [account, recordVisitAction],
  )

  const clearAll = useCallback(() => {
    if (!account) return
    void clearRecentItemsAction(account.user.id, account.token)
  }, [account, clearRecentItemsAction])

  return { items, recordVisit, clearAll }
}
