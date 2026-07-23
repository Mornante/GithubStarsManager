import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useRepoModal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const openRepoKey = searchParams.get('repo')

  const openRepo = useCallback(
    (nameWithOwner: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('repo', nameWithOwner)
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  const closeRepo = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('repo')
        return next
      },
      { replace: false },
    )
  }, [setSearchParams])

  return { openRepoKey, openRepo, closeRepo }
}
