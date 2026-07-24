import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../store/gsmStateStore'
import type { DeploymentRecord, NoteRecord, ReviewStage } from '../types/gsmState'

// Flattens the gist's repos-keyed schema back into the three
// Record<repoId, X> shapes the rest of the app already consumes (repo card
// badges, filter predicates, the Deployments/Notes list pages) — so the
// gsm-state.json schema stays free to evolve without every call site having
// to know its on-disk shape.
function flattenRepos<K extends 'reviewTag' | 'deployment' | 'note'>(
  repos: Record<string, { reviewTag?: ReviewStage; deployment?: DeploymentRecord; note?: NoteRecord }>,
  field: K,
) {
  const out: Record<string, NonNullable<(typeof repos)[string][K]>> = {}
  for (const [id, entry] of Object.entries(repos)) {
    const value = entry[field]
    if (value !== undefined) out[id] = value
  }
  return out
}

export function useGsmState() {
  const account = useAuthStore((s) => s.currentAccount())
  const load = useGsmStateStore((s) => s.load)
  const status = useGsmStateStore((s) => s.status)
  const error = useGsmStateStore((s) => s.error)
  const userState = useGsmUserState(account?.user.id ?? null)
  const hasKickedOffLoad = useRef(false)

  const repos = userState.state.repos
  const reviewTags = useMemo(() => flattenRepos(repos, 'reviewTag'), [repos])
  const deployments = useMemo(() => flattenRepos(repos, 'deployment'), [repos])
  const notes = useMemo(() => flattenRepos(repos, 'note'), [repos])

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
    reviewTags,
    deployments,
    notes,
    status,
    error,
    retry,
  }
}
