import { useEffect, useState } from 'react'
import { fetchRepoDeploymentInfo, type RepoDeploymentInfo } from '../api/deploymentsApi'

// Module-level cache, keyed by "owner/name": DeploymentsPage renders one card
// per tracked deployment, each wanting the same release/commit history, and
// opening a card's modal wants it again — without this, that's one GraphQL
// request per card plus another per modal-open, all for identical data.
// Session-lifetime only (no TTL/invalidation) since release/commit history is
// effectively static within a single sitting.
const cache = new Map<string, Promise<RepoDeploymentInfo>>()

function getOrFetch(token: string, owner: string, name: string): Promise<RepoDeploymentInfo> {
  const key = `${owner}/${name}`.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const promise = fetchRepoDeploymentInfo(token, owner, name).catch((err: unknown) => {
    cache.delete(key) // don't let a failed fetch poison the cache for a retry
    throw err
  })
  cache.set(key, promise)
  return promise
}

export function useRepoDeploymentInfo(token: string | undefined, owner: string, name: string) {
  const [info, setInfo] = useState<RepoDeploymentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    getOrFetch(token, owner, name)
      .then((result) => {
        if (cancelled) return
        setInfo(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, owner, name])

  return { info, loading }
}
