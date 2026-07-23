import { memo } from 'react'
import type { Organization } from '../../types/github'
import { OcticonPeople, OcticonRepo, OcticonStar } from '../icons/Octicons'

function OrgCard({ org, onOpen }: { org: Organization; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="w-full text-left border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors cursor-pointer p-4 flex flex-col gap-2"
      onClick={onOpen}
    >
      <div className="flex items-center gap-2">
        <img src={org.avatarUrl} alt="" className="w-8 h-8 rounded-md shrink-0" />
        <div className="min-w-0">
          <span className="font-mono text-sm font-medium truncate block">{org.login}</span>
          {org.name && <span className="text-xs text-fg-muted truncate block">{org.name}</span>}
        </div>
      </div>

      {org.description && <p className="text-sm text-fg-muted line-clamp-2">{org.description}</p>}

      <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-fg-muted">
        {org.followerCount != null && (
          <span className="flex items-center gap-1 text-attention-fg font-medium">
            <OcticonStar /> {org.followerCount.toLocaleString()}
          </span>
        )}
        {org.repoCount != null && (
          <span className="flex items-center gap-1">
            <OcticonRepo /> {org.repoCount.toLocaleString()}
          </span>
        )}
        {org.memberCount != null && (
          <span className="flex items-center gap-1">
            <OcticonPeople /> {org.memberCount.toLocaleString()}
          </span>
        )}
        {org.location && <span>{org.location}</span>}
      </div>
    </button>
  )
}

export default memo(OrgCard)
