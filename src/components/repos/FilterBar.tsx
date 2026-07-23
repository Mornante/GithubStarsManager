import type { Repo, StarList } from '../../types/github'
import type { FilterState, FilterValue, SortKey } from '../../types/filters'
import { FILTER_DEFINITIONS, SORT_OPTIONS } from '../../config/filterDefinitions'
import { OcticonChevronDown } from '../icons/Octicons'

export default function FilterBar({
  repos,
  lists,
  filterState,
  setFilter,
  sortKey,
  setSortKey,
  view,
  setView,
}: {
  repos: Repo[]
  lists: StarList[]
  filterState: FilterState
  setFilter: (key: string, value: FilterValue) => void
  sortKey: SortKey
  setSortKey: (key: SortKey) => void
  view: 'grid' | 'compact'
  setView: (view: 'grid' | 'compact') => void
}) {
  const otherDefs = FILTER_DEFINITIONS.filter((def) => def.kind !== 'search')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
        {otherDefs.map((def) => (
          <div key={def.key} className="flex items-center gap-3">
            <span className="text-xs font-medium text-fg-muted w-24 shrink-0">{def.label}</span>
            <def.control
              value={filterState[def.key] ?? def.defaultValue}
              options={def.getOptions?.(repos, lists)}
              onChange={(next) => setFilter(def.key, next)}
            />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-fg-muted w-24 shrink-0">Sort by</span>
          <div className="relative w-36">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full appearance-none text-sm rounded-md border border-border-default bg-canvas pl-3 pr-7 py-1.5"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <OcticonChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-fg-muted w-24 shrink-0">View</span>
          <div className="flex rounded-md border border-border-default overflow-hidden">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 text-sm ${view === 'grid' ? 'bg-accent-emphasis text-white' : 'hover:bg-canvas-subtle'}`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView('compact')}
              className={`px-3 py-1.5 text-sm ${view === 'compact' ? 'bg-accent-emphasis text-white' : 'hover:bg-canvas-subtle'}`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
