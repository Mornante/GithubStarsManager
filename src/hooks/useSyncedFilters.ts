import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FILTER_DEFINITIONS, DEFAULT_SORT_KEY } from '../config/filterDefinitions'
import type { FilterState, FilterValue, SortKey } from '../types/filters'

const SORT_PARAM = 'sort'
const VIEW_PARAM = 'view'

export function useSyncedFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filterState: FilterState = useMemo(() => {
    const state: FilterState = {}
    for (const def of FILTER_DEFINITIONS) {
      state[def.key] = def.deserialize(searchParams.get(def.key))
    }
    return state
  }, [searchParams])

  const sortKey = (searchParams.get(SORT_PARAM) as SortKey) || DEFAULT_SORT_KEY
  const view: 'grid' | 'compact' = searchParams.get(VIEW_PARAM) === 'compact' ? 'compact' : 'grid'

  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      const def = FILTER_DEFINITIONS.find((d) => d.key === key)
      if (!def) return
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const serialized = def.serialize(value)
          if (serialized === null) next.delete(key)
          else next.set(key, serialized)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilter = useCallback(
    (key: string) => {
      const def = FILTER_DEFINITIONS.find((d) => d.key === key)
      if (def) setFilter(key, def.defaultValue)
    },
    [setFilter],
  )

  const clearAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const def of FILTER_DEFINITIONS) next.delete(def.key)
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  // Clears every filter and applies exactly the given overrides in one URL update —
  // used by filter-card presets so clicking one shows only that preset's results.
  const applyPreset = useCallback(
    (overrides: FilterState) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const def of FILTER_DEFINITIONS) {
            const value = overrides[def.key] ?? def.defaultValue
            const serialized = def.serialize(value)
            if (serialized === null) next.delete(def.key)
            else next.set(def.key, serialized)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setSortKey = useCallback(
    (key: SortKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set(SORT_PARAM, key)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setView = useCallback(
    (next: 'grid' | 'compact') => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === 'grid') params.delete(VIEW_PARAM)
          else params.set(VIEW_PARAM, next)
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { filterState, setFilter, clearFilter, clearAll, applyPreset, sortKey, setSortKey, view, setView }
}
