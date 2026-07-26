import { useMemo, useState } from 'react'
import { useRecentItems } from '../hooks/useRecentItems'
import { RECENT_ITEM_LABEL } from '../config/recentItems'
import type { RecentItemType } from '../types/gsmState'
import RecentItemRow from '../components/shared/RecentItemRow'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { OcticonChevronDown, OcticonSearch } from '../components/icons/Octicons'

const TYPE_OPTIONS: RecentItemType[] = ['repo', 'org', 'deployment', 'note', 'issue']

export default function RecentItemsPage() {
  const { items, clearAll } = useRecentItems()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<RecentItemType | 'all'>('all')
  const [confirmingClear, setConfirmingClear] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter(
      (item) =>
        (typeFilter === 'all' || item.type === typeFilter) &&
        (!query || item.name.toLowerCase().includes(query)),
    )
  }, [items, search, typeFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-semibold">Recent Activity</h1>
          <p className="text-sm text-fg-muted">
            The last {items.length === 1 ? 'item' : 'items'} you opened, most recent first.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="shrink-0 rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-danger-fg hover:bg-danger-fg/10"
          >
            Clear all
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <OcticonSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recent activity…"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-border-default bg-canvas focus:outline-none focus:ring-2 focus:ring-accent-fg"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as RecentItemType | 'all')}
              className="appearance-none text-sm rounded-md border border-border-default bg-canvas pl-3 pr-7 py-1.5"
            >
              <option value="all">All types</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {RECENT_ITEM_LABEL[type]}
                </option>
              ))}
            </select>
            <OcticonChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted" />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-fg-muted py-8 text-center">
          Nothing visited yet — repos, organizations, deployments, notes, and issues you open will show up
          here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-fg-muted py-8 text-center">
          No matching items — try a different search or type.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <RecentItemRow key={item.id} item={item} variant="full" />
          ))}
        </div>
      )}

      {confirmingClear && (
        <ConfirmDialog
          title="Clear recent activity?"
          message={`This removes all ${items.length} tracked ${items.length === 1 ? 'item' : 'items'} from your recent activity. This can't be undone.`}
          confirmLabel="Clear all"
          onConfirm={() => {
            clearAll()
            setConfirmingClear(false)
          }}
          onCancel={() => setConfirmingClear(false)}
        />
      )}
    </div>
  )
}
