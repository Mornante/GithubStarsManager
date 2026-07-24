import { memo } from 'react'
import type { RepoPullRequest } from '../../types/github'
import { OcticonPullRequest } from '../icons/Octicons'

const STATE_COLORS: Record<RepoPullRequest['state'], string> = {
  open: 'text-success-fg',
  merged: 'text-done-fg',
  closed: 'text-danger-fg',
}

function PullRequestRow({
  pullRequest,
  hasChanges,
  onOpen,
}: {
  pullRequest: RepoPullRequest
  hasChanges: boolean
  onOpen: () => void
}) {
  return (
    <a
      href={pullRequest.url}
      target="_blank"
      rel="noreferrer"
      onClick={onOpen}
      className="flex items-center gap-3 border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors p-3"
    >
      <OcticonPullRequest className={`shrink-0 ${STATE_COLORS[pullRequest.state]}`} />

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{pullRequest.title}</span>
        <span className="text-xs text-fg-muted font-mono truncate block">#{pullRequest.number}</span>
      </div>

      {hasChanges && (
        <span className="shrink-0 rounded-full bg-accent-fg/10 text-accent-fg text-[11px] font-medium px-2 py-0.5">
          Updated
        </span>
      )}

      <span className="shrink-0 text-xs text-fg-muted">{new Date(pullRequest.updatedAt).toLocaleDateString()}</span>
    </a>
  )
}

export default memo(PullRequestRow)
