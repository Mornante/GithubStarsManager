import type { Repo } from '../types/github'
import type { FilterPredicateCtx, FilterState, SortKey } from '../types/filters'
import { FILTER_DEFINITIONS, SORT_OPTIONS } from '../config/filterDefinitions'

export function filterRepos(repos: Repo[], filterState: FilterState, ctx: FilterPredicateCtx): Repo[] {
  return repos.filter((repo) =>
    FILTER_DEFINITIONS.every((def) => def.predicate(repo, filterState[def.key] ?? def.defaultValue, ctx)),
  )
}

export function sortRepos(repos: Repo[], sortKey: SortKey): Repo[] {
  const sortOption = SORT_OPTIONS.find((s) => s.key === sortKey) ?? SORT_OPTIONS[0]
  return [...repos].sort(sortOption.compare)
}
