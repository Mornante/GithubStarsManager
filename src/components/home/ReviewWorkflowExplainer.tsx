import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Repo, StarList } from '../../types/github'
import type { DeploymentRecord, ReviewStage } from '../../types/gsmState'
import type { FilterState } from '../../types/filters'
import { filterRepos } from '../../selectors/filterRepos'
import { REVIEW_TAG_LISTS } from '../../config/reviewTags'
import {
  OcticonCheck,
  OcticonChevronDown,
  OcticonEye,
  OcticonRepo,
  OcticonStar,
  OcticonTag,
} from '../icons/Octicons'

const STEPS: {
  label: string
  detail: string
  icon: typeof OcticonStar
  colorClass: string
  to: string | null
  overrides: FilterState | null
}[] = [
  {
    label: 'Star',
    detail: 'Star anything that looks worth learning from',
    icon: OcticonStar,
    colorClass: 'bg-attention-emphasis',
    to: null,
    overrides: null,
  },
  {
    label: REVIEW_TAG_LISTS[0].shortLabel,
    detail: REVIEW_TAG_LISTS[0].description,
    icon: OcticonTag,
    colorClass: 'bg-fg-muted',
    to: '/repos?reviewStage=REVIEW_REQUIRED',
    overrides: { reviewStage: 'REVIEW_REQUIRED' },
  },
  {
    label: REVIEW_TAG_LISTS[1].shortLabel,
    detail: REVIEW_TAG_LISTS[1].description,
    icon: OcticonEye,
    colorClass: 'bg-accent-emphasis',
    to: '/repos?reviewStage=IN_REVIEW',
    overrides: { reviewStage: 'IN_REVIEW' },
  },
  {
    label: REVIEW_TAG_LISTS[2].shortLabel,
    detail: REVIEW_TAG_LISTS[2].description,
    icon: OcticonCheck,
    colorClass: 'bg-success-emphasis',
    to: '/repos?reviewStage=REVIEWED',
    overrides: { reviewStage: 'REVIEWED' },
  },
  {
    label: 'Add to a list',
    detail: 'File it into a real, topic-based star list',
    icon: OcticonRepo,
    colorClass: 'bg-done-emphasis',
    to: '/repos?uncategorized=yes',
    overrides: { uncategorized: 'yes' },
  },
]

export default function ReviewWorkflowExplainer({
  repos,
  lists,
  reviewTags,
  deployments,
}: {
  repos: Repo[]
  lists: StarList[]
  reviewTags: Record<string, ReviewStage>
  deployments: Record<string, DeploymentRecord>
}) {
  return (
    <section>
      <h2 className="text-lg font-display font-semibold mb-1">How I review stars</h2>
      <p className="text-sm text-fg-muted mb-6">
        Every repo moves through this pipeline — the review stage and deployment status are stored as JSON in
        a private <span className="font-mono text-xs">GSM:STATE</span> gist on your GitHub account, separate
        from your real star lists, which stay free for genuine topic-based collections.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-1">
        {STEPS.map((step, i) => {
          const count = step.overrides
            ? filterRepos(repos, step.overrides, { lists, reviewTags, deployments }).length
            : null

          const stepContent = (
            <div className="flex flex-col items-center text-center gap-2">
              <div
                className={`relative w-11 h-11 rounded-full ring-4 ring-canvas flex items-center justify-center text-white shrink-0 ${step.colorClass}`}
              >
                <step.icon className="w-5 h-5" />
                {count !== null && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-canvas border border-border-default text-[10px] font-semibold text-fg-default flex items-center justify-center px-1">
                    {count}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium">{step.label}</div>
              <p className="text-xs text-fg-muted max-w-[11rem]">{step.detail}</p>
            </div>
          )

          return (
            <Fragment key={step.label}>
              {i > 0 && (
                <OcticonChevronDown
                  aria-hidden
                  className="hidden sm:block -rotate-90 text-fg-muted shrink-0 mt-5"
                />
              )}
              <div className="sm:flex-1">
                {step.to ? (
                  <Link to={step.to} className="block hover:opacity-80 transition-opacity">
                    {stepContent}
                  </Link>
                ) : (
                  stepContent
                )}
              </div>
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}
