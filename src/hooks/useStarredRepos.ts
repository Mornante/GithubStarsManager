import { useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useStarsStore, useUserData } from '../store/starsStore'

export function useStarredRepos() {
  const account = useAuthStore((s) => s.currentAccount())
  const refresh = useStarsStore((s) => s.refresh)
  const status = useStarsStore((s) => s.status)
  const error = useStarsStore((s) => s.error)
  const data = useUserData(account?.user.id ?? null)
  const hasKickedOffRefresh = useRef(false)

  useEffect(() => {
    if (!account || hasKickedOffRefresh.current) return
    hasKickedOffRefresh.current = true
    void refresh(account.user.id, account.token)
  }, [account, refresh])

  const retry = useCallback(() => {
    if (account) void refresh(account.user.id, account.token)
  }, [account, refresh])

  return { repos: data.repos, lists: data.lists, lastSyncedAt: data.lastSyncedAt, status, error, retry }
}
