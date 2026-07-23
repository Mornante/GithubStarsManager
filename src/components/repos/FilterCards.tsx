import type { Repo, StarList } from '../../types/github'
import type { FilterState } from '../../types/filters'
import type { DeploymentRecord, ReviewStage } from '../../types/gsmState'
import { FILTER_CARD_DEFINITIONS } from '../../config/filterCards'
import { filterRepos } from '../../selectors/filterRepos'

export default function FilterCards({
  repos,
  lists,
  reviewTags,
  deployments,
  onApply,
}: {
  repos: Repo[]
  lists: StarList[]
  reviewTags: Record<string, ReviewStage>
  deployments: Record<string, DeploymentRecord>
  onApply: (overrides: FilterState) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_CARD_DEFINITIONS.map((card) => {
        const count = filterRepos(repos, card.overrides, { lists, reviewTags, deployments }).length

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onApply(card.overrides)}
            className="flex items-center gap-2 rounded-md border border-border-default bg-canvas-subtle px-2.5 py-1.5 text-left hover:border-accent-fg"
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ${card.colorClass}`}>
              <card.icon className="w-3.5 h-3.5" />
            </span>
            <span>
              <span className="block text-xs font-medium leading-tight">{card.label}</span>
              <span className="block text-[11px] text-fg-muted leading-tight">{count} repos</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
