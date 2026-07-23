import type { Repo, StarList } from '../../types/github'
import type { DeploymentRecord, ReviewStage } from '../../types/gsmState'
import { REVIEW_TAG_LISTS } from '../../config/reviewTags'
import { DEPLOY_TAG } from '../../config/deployTag'
import LanguageDot from '../shared/LanguageDot'
import TopicPill from '../shared/TopicPill'
import ListBadge from '../shared/ListBadge'
import { OcticonCheck, OcticonEye, OcticonRocket, OcticonStar, OcticonTag } from '../icons/Octicons'

const STAGE_ICONS = { REVIEW_REQUIRED: OcticonTag, IN_REVIEW: OcticonEye, REVIEWED: OcticonCheck }
const STAGE_COLORS = {
  REVIEW_REQUIRED: 'bg-fg-muted/15 text-fg-muted',
  IN_REVIEW: 'bg-accent-emphasis/15 text-accent-fg',
  REVIEWED: 'bg-success-emphasis/15 text-success-fg',
}

const EMPTY_REVIEW_TAGS: Record<string, ReviewStage> = {}
const EMPTY_DEPLOYMENTS: Record<string, DeploymentRecord> = {}

export default function RepoCard({
  repo,
  lists,
  reviewTags = EMPTY_REVIEW_TAGS,
  deployments = EMPTY_DEPLOYMENTS,
  view,
  onOpen,
}: {
  repo: Repo
  lists: StarList[]
  reviewTags?: Record<string, ReviewStage>
  deployments?: Record<string, DeploymentRecord>
  view: 'grid' | 'compact'
  onOpen: () => void
}) {
  const memberLists = lists.filter((l) => repo.listIds.includes(l.id))
  const stage = reviewTags[repo.id]
  const isDeployed = Boolean(deployments[repo.id])
  const StageIcon = stage ? STAGE_ICONS[stage] : null
  const stageLabel = stage ? REVIEW_TAG_LISTS.find((d) => d.key === stage)?.shortLabel : null

  return (
    <div
      className={`border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors cursor-pointer ${
        view === 'grid' ? 'p-4 flex flex-col gap-2' : 'p-3 flex items-center gap-4'
      }`}
      onClick={onOpen}
    >
      <div className={view === 'grid' ? '' : 'flex-1 min-w-0'}>
        <span className="font-mono text-sm font-medium truncate block">
          <span className="text-fg-muted">{repo.owner.login}/</span>
          {repo.name}
        </span>
        {repo.description && (
          <p className="text-sm text-fg-muted line-clamp-2 mt-1">{repo.description}</p>
        )}
      </div>

      <div className={`flex flex-wrap items-center gap-4 ${view === 'grid' ? 'mt-1' : 'shrink-0'}`}>
        <LanguageDot language={repo.primaryLanguage?.name ?? null} />
        <span className="flex items-center gap-1 text-xs text-attention-fg font-medium">
          <OcticonStar /> {repo.stargazerCount.toLocaleString()}
        </span>
        <span className="text-xs text-fg-muted">
          Updated {new Date(repo.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {view === 'grid' && (repo.topics.length > 0 || memberLists.length > 0 || stage || isDeployed) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {stage && StageIcon && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${STAGE_COLORS[stage]}`}
            >
              <StageIcon className="w-3 h-3" /> {stageLabel}
            </span>
          )}
          {isDeployed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-emphasis/15 text-accent-fg px-2 py-0.5 text-[11px] font-medium">
              <OcticonRocket className="w-3 h-3" /> {DEPLOY_TAG.shortLabel}
            </span>
          )}
          {repo.topics.slice(0, 3).map((topic) => (
            <TopicPill key={topic} topic={topic} />
          ))}
          {memberLists.map((list) => (
            <ListBadge key={list.id} name={list.name} />
          ))}
        </div>
      )}
    </div>
  )
}
