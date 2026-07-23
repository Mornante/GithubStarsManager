import type { ComponentType } from 'react'
import type { Repo, StarList } from './github'
import type { DeploymentRecord, ReviewStage } from './gsmState'

export type FilterValue = string | string[] | boolean | null

export type FilterState = Record<string, FilterValue>

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterControlProps<V extends FilterValue = FilterValue> {
  value: V
  options?: FilterOption[]
  onChange: (next: V) => void
}

export interface FilterPredicateCtx {
  lists: StarList[]
  reviewTags: Record<string, ReviewStage>
  deployments: Record<string, DeploymentRecord>
}

export interface FilterDefinition<V extends FilterValue = FilterValue> {
  key: string
  label: string
  kind: 'search' | 'select' | 'multiselect'
  control: ComponentType<FilterControlProps<V>>
  defaultValue: V
  getOptions?: (repos: Repo[], lists: StarList[]) => FilterOption[]
  predicate: (repo: Repo, value: V, ctx: FilterPredicateCtx) => boolean
  serialize: (value: V) => string | null
  deserialize: (raw: string | null) => V
  toPillLabels: (value: V, options?: FilterOption[]) => string[]
  isActive: (value: V) => boolean
}

export type SortKey = 'starred' | 'stars' | 'updated' | 'name'

export interface SortOption {
  key: SortKey
  label: string
  compare: (a: Repo, b: Repo) => number
}
