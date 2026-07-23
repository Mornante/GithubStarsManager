import { useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../store/gsmStateStore'

export function useGsmState() {
  const account = useAuthStore((s) => s.currentAccount())
  const load = useGsmStateStore((s) => s.load)
  const status = useGsmStateStore((s) => s.status)
  const error = useGsmStateStore((s) => s.error)
  const userState = useGsmUserState(account?.user.id ?? null)
  const hasKickedOffLoad = useRef(false)

  useEffect(() => {
    // Unlike a plain refetch, load() creates the gist when none is found yet,
    // so re-running it from every page that mounts this hook could race and
    // create duplicate gists. Once this user has a known gistId, only an
    // explicit retry() should trigger another load.
    if (!account || hasKickedOffLoad.current || userState.gistId) return
    hasKickedOffLoad.current = true
    void load(account.user.id, account.token)
  }, [account, load, userState.gistId])

  const retry = useCallback(() => {
    if (account) void load(account.user.id, account.token)
  }, [account, load])

  return {
    reviewTags: userState.state.reviewTags,
    deployments: userState.state.deployments,
    notes: userState.state.notes,
    status,
    error,
    retry,
  }
}
