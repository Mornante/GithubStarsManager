import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useOrgModal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const openOrgKey = searchParams.get('org')

  const openOrg = useCallback(
    (login: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('org', login)
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  const closeOrg = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('org')
        return next
      },
      { replace: false },
    )
  }, [setSearchParams])

  return { openOrgKey, openOrg, closeOrg }
}
