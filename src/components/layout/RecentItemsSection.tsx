import { Link } from 'react-router-dom'
import { useRecentItems } from '../../hooks/useRecentItems'
import { RECENT_ITEMS_NAV_LIMIT } from '../../types/gsmState'
import { OcticonChevronDown } from '../icons/Octicons'
import RecentItemRow from '../shared/RecentItemRow'

export default function RecentItemsSection({ collapsed = false }: { collapsed?: boolean }) {
  const { items } = useRecentItems()
  const visible = items.slice(0, RECENT_ITEMS_NAV_LIMIT)

  return (
    <div className="p-2 border-t border-border-default space-y-1">
      {!collapsed && (
        <div className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-fg">
          Recent Activity
        </div>
      )}

      {visible.length === 0 ? (
        !collapsed && (
          <p className="px-3 pb-1 text-xs text-fg-muted">
            Repositories, Organizatiions, deployments, notes, and issues you open will show up here.
          </p>
        )
      ) : (
        <>
          {visible.map((item) => (
            <RecentItemRow key={item.id} item={item} collapsed={collapsed} />
          ))}

          <Link
            to="/recent"
            title={collapsed ? 'View more' : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-default hover:bg-canvas-subtle ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <OcticonChevronDown className="-rotate-90" />
            {!collapsed && 'View more'}
          </Link>
        </>
      )}
    </div>
  )
}
