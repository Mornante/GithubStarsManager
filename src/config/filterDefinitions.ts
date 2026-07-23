import type { FilterDefinition, FilterOption, FilterPredicateCtx, SortOption } from '../types/filters'
import type { Repo } from '../types/github'
import SearchFilterControl from '../components/repos/filters/SearchFilterControl'
import MultiSelectFilterControl from '../components/repos/filters/MultiSelectFilterControl'
import SelectFilterControl from '../components/repos/filters/SelectFilterControl'
import { legacySystemListIds } from '../selectors/reviewTagSelectors'
import { REVIEW_TAG_LISTS } from './reviewTags'

function csvSerialize(values: string[]): string | null {
  return values.length > 0 ? values.map(encodeURIComponent).join(',') : null
}

function csvDeserialize(raw: string | null): string[] {
  return raw ? raw.split(',').map(decodeURIComponent).filter(Boolean) : []
}

function uniqueOptionsFrom(values: Iterable<string>): FilterOption[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count! - a.count!)
}

const YES_NO_OPTIONS: FilterOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

// Builds a tri-state (Any / Yes / No) filter definition from a boolean predicate —
// "No" simply negates it, so callers only ever write the "Yes" condition.
function yesNoFilter(
  key: string,
  label: string,
  matches: (repo: Repo, ctx: FilterPredicateCtx) => boolean,
): FilterDefinition {
  return {
    key,
    label,
    kind: 'select',
    control: SelectFilterControl as FilterDefinition['control'],
    defaultValue: null,
    getOptions: () => YES_NO_OPTIONS,
    predicate: (repo, value, ctx) => {
      if (value === null) return true
      const isMatch = matches(repo, ctx)
      return value === 'yes' ? isMatch : !isMatch
    },
    serialize: (value) => (value ? String(value) : null),
    deserialize: (raw) => raw,
    toPillLabels: (value) => (value ? [value === 'yes' ? 'Yes' : 'No'] : []),
    isActive: (value) => Boolean(value),
  }
}

export const FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    key: 'q',
    label: 'Search',
    kind: 'search',
    control: SearchFilterControl as FilterDefinition['control'],
    defaultValue: '',
    predicate: (repo, value) =>
      !value || repo.name.toLowerCase().includes(String(value).toLowerCase()),
    serialize: (value) => (value ? String(value) : null),
    deserialize: (raw) => raw ?? '',
    toPillLabels: (value) => (value ? [`"${value}"`] : []),
    isActive: (value) => Boolean(value),
  },
  {
    key: 'language',
    label: 'Language',
    kind: 'multiselect',
    control: MultiSelectFilterControl as FilterDefinition['control'],
    defaultValue: [],
    getOptions: (repos) => uniqueOptionsFrom(repos.map((r) => r.primaryLanguage?.name).filter(Boolean) as string[]),
    predicate: (repo, value) => {
      const langs = value as string[]
      return langs.length === 0 || (repo.primaryLanguage !== null && langs.includes(repo.primaryLanguage.name))
    },
    serialize: (value) => csvSerialize(value as string[]),
    deserialize: (raw) => csvDeserialize(raw),
    toPillLabels: (value) => value as string[],
    isActive: (value) => (value as string[]).length > 0,
  },
  {
    key: 'topic',
    label: 'Topic',
    kind: 'multiselect',
    control: MultiSelectFilterControl as FilterDefinition['control'],
    defaultValue: [],
    getOptions: (repos) => uniqueOptionsFrom(repos.flatMap((r) => r.topics)),
    predicate: (repo, value) => {
      const topics = value as string[]
      return topics.length === 0 || topics.some((t) => repo.topics.includes(t))
    },
    serialize: (value) => csvSerialize(value as string[]),
    deserialize: (raw) => csvDeserialize(raw),
    toPillLabels: (value) => value as string[],
    isActive: (value) => (value as string[]).length > 0,
  },
  {
    key: 'license',
    label: 'License',
    kind: 'multiselect',
    control: MultiSelectFilterControl as FilterDefinition['control'],
    defaultValue: [],
    getOptions: (repos) =>
      uniqueOptionsFrom(repos.map((r) => r.licenseInfo?.spdxId ?? r.licenseInfo?.name).filter(Boolean) as string[]),
    predicate: (repo, value) => {
      const licenses = value as string[]
      if (licenses.length === 0) return true
      const key = repo.licenseInfo?.spdxId ?? repo.licenseInfo?.name
      return key !== undefined && licenses.includes(key)
    },
    serialize: (value) => csvSerialize(value as string[]),
    deserialize: (raw) => csvDeserialize(raw),
    toPillLabels: (value) => value as string[],
    isActive: (value) => (value as string[]).length > 0,
  },
  {
    key: 'list',
    label: 'Star list',
    kind: 'select',
    control: SelectFilterControl as FilterDefinition['control'],
    defaultValue: null,
    getOptions: (_repos, lists) => lists.map((l) => ({ value: l.id, label: l.name, count: l.repoIds.length })),
    predicate: (repo, value) => {
      if (!value) return true
      return repo.listIds.includes(value as string)
    },
    serialize: (value) => (value ? String(value) : null),
    deserialize: (raw) => raw,
    toPillLabels: (value, options) => {
      if (!value) return []
      const opt = options?.find((o) => o.value === value)
      return opt ? [opt.label] : [String(value)]
    },
    isActive: (value) => Boolean(value),
  },
  {
    key: 'reviewStage',
    label: 'Review status',
    kind: 'select',
    control: SelectFilterControl as FilterDefinition['control'],
    defaultValue: null,
    getOptions: () => REVIEW_TAG_LISTS.map((def) => ({ value: def.key, label: def.shortLabel })),
    predicate: (repo, value, ctx) => {
      if (!value) return true
      return ctx.reviewTags[repo.id] === value
    },
    serialize: (value) => (value ? String(value) : null),
    deserialize: (raw) => raw,
    toPillLabels: (value, options) => {
      if (!value) return []
      const opt = options?.find((o) => o.value === value)
      return opt ? [opt.label] : [String(value)]
    },
    isActive: (value) => Boolean(value),
  },
  yesNoFilter('unsorted', 'Unsorted', (repo) => repo.listIds.length === 0),
  yesNoFilter('untagged', 'Not tagged', (repo, ctx) => !ctx.reviewTags[repo.id]),
  yesNoFilter('uncategorized', 'Tagged, not categorized', (repo, ctx) => {
    const isTagged = Boolean(ctx.reviewTags[repo.id])
    // "Categorized" means filed into a real collection — any leftover legacy
    // #️⃣GSM:TAG:* list from before the gist migration doesn't count.
    const legacyIds = legacySystemListIds(ctx.lists)
    const isCategorized = repo.listIds.some((id) => !legacyIds.has(id))
    return isTagged && !isCategorized
  }),
  yesNoFilter('deployed', 'Deployed', (repo, ctx) => Boolean(ctx.deployments[repo.id])),
]

export const SORT_OPTIONS: SortOption[] = [
  { key: 'starred', label: 'Recently starred', compare: (a, b) => b.starredAt.localeCompare(a.starredAt) },
  { key: 'stars', label: 'Star count', compare: (a, b) => b.stargazerCount - a.stargazerCount },
  { key: 'updated', label: 'Updated', compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  { key: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
]

export const DEFAULT_SORT_KEY = 'starred'
