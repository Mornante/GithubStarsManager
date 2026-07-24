import { memo } from 'react'
import type { Issue } from '../../api/issuesApi'
import { OcticonIssueClosed, OcticonIssueOpened } from '../icons/Octicons'

function IssueRow({ issue, hasChanges, onOpen }: { issue: Issue; hasChanges: boolean; onOpen: () => void }) {
  const isOpen = issue.state === 'open'

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noreferrer"
      onClick={onOpen}
      className="flex items-center gap-3 border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors p-3"
    >
      {isOpen ? (
        <OcticonIssueOpened className="text-success-fg shrink-0" />
      ) : (
        <OcticonIssueClosed className="text-done-fg shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{issue.title}</span>
        <span className="text-xs text-fg-muted font-mono truncate block">
          {issue.repoNameWithOwner} #{issue.number}
        </span>
      </div>

      {hasChanges && (
        <span className="shrink-0 rounded-full bg-accent-fg/10 text-accent-fg text-[11px] font-medium px-2 py-0.5">
          Updated
        </span>
      )}

      <span className="shrink-0 text-xs text-fg-muted">{new Date(issue.updatedAt).toLocaleDateString()}</span>
    </a>
  )
}

export default memo(IssueRow)
