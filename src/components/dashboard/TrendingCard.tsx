import { memo } from 'react'
import type { SearchRepoResult } from '../../api/rest'
import LanguageDot from '../shared/LanguageDot'
import { OcticonStar } from '../icons/Octicons'

function TrendingCard({ repo, onOpen }: { repo: SearchRepoResult; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="w-full text-left border border-border-default rounded-xl bg-canvas-subtle hover:border-accent-fg transition-colors cursor-pointer p-4 flex flex-col gap-2"
      onClick={onOpen}
    >
      <span className="font-mono text-sm font-medium truncate block">
        <span className="text-fg-muted">{repo.owner.login}/</span>
        {repo.name}
      </span>
      {repo.description && <p className="text-sm text-fg-muted line-clamp-2 mt-1">{repo.description}</p>}

      <div className="flex flex-wrap items-center gap-4 mt-1">
        <LanguageDot language={repo.language} />
        <span className="flex items-center gap-1 text-xs text-attention-fg font-medium">
          <OcticonStar /> {repo.stargazers_count.toLocaleString()}
        </span>
        <span className="text-xs text-fg-muted">Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
      </div>
    </button>
  )
}

export default memo(TrendingCard)
