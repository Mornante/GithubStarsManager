import type { Repo, StarList } from '../../types/github'
import type { FilterState } from '../../types/filters'
import { FILTER_DEFINITIONS } from '../../config/filterDefinitions'

export default function ActiveFilterPills({
  repos,
  lists,
  filterState,
  clearFilter,
  clearAll,
}: {
  repos: Repo[]
  lists: StarList[]
  filterState: FilterState
  clearFilter: (key: string) => void
  clearAll: () => void
}) {
  const activeDefs = FILTER_DEFINITIONS.filter((def) =>
    def.isActive(filterState[def.key] ?? def.defaultValue),
  )
  if (activeDefs.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {activeDefs.flatMap((def) => {
        const options = def.getOptions?.(repos, lists)
        const labels = def.toPillLabels(filterState[def.key] ?? def.defaultValue, options)
        return labels.map((label) => (
          <button
            key={`${def.key}:${label}`}
            type="button"
            onClick={() => clearFilter(def.key)}
            className="flex items-center gap-1 text-xs rounded-full bg-canvas-subtle border border-border-default px-2 py-1 hover:border-danger-fg hover:text-danger-fg"
          >
            {def.label}: {label}
            <span aria-hidden>×</span>
          </button>
        ))
      })}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-fg-muted hover:text-fg-default underline"
      >
        Clear all
      </button>
    </div>
  )
}
