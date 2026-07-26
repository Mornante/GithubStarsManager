import { memo } from 'react'
import { Link } from 'react-router-dom'
import { RECENT_ITEM_ICON, RECENT_ITEM_LABEL } from '../../config/recentItems'
import type { RecentItem } from '../../types/gsmState'

// Renders as an in-app <Link> unless the item points off-site (e.g. an
// issue's GitHub URL), in which case it opens in a new tab like the rest of
// the app's external links.
function RecentItemRow({
  item,
  variant = 'compact',
  collapsed = false,
}: {
  item: RecentItem
  variant?: 'compact' | 'full'
  collapsed?: boolean
}) {
  const Icon = RECENT_ITEM_ICON[item.type]

  const content =
    variant === 'compact' ? (
      <>
        <Icon className="shrink-0" />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </>
    ) : (
      <>
        <Icon className="shrink-0 text-fg-muted" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{item.name}</span>
          <span className="text-xs text-fg-muted truncate block">{RECENT_ITEM_LABEL[item.type]}</span>
        </div>
        <span className="shrink-0 text-xs text-fg-muted">{new Date(item.visitedAt).toLocaleString()}</span>
      </>
    )

  const className =
    variant === 'compact'
      ? `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-fg-muted hover:text-fg-default hover:bg-canvas-subtle ${
          collapsed ? 'justify-center' : ''
        }`
      : 'flex items-center gap-3 border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors p-3'

  const title = collapsed ? item.name : undefined

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" title={title} className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link to={item.href} title={title} className={className}>
      {content}
    </Link>
  )
}

export default memo(RecentItemRow)
