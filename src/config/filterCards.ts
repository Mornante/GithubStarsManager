import type { ComponentType } from 'react'
import type { FilterState } from '../types/filters'
import { REVIEW_TAG_LISTS } from './reviewTags'
import { DEPLOY_TAG } from './deployTag'
import { OcticonCheck, OcticonEye, OcticonRocket, OcticonStar, OcticonTag } from '../components/icons/Octicons'

export interface FilterCardDef {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  colorClass: string
  overrides: FilterState
}

export const FILTER_CARD_DEFINITIONS: FilterCardDef[] = [
  {
    key: 'REVIEW_REQUIRED',
    label: REVIEW_TAG_LISTS[0].shortLabel,
    icon: OcticonTag,
    colorClass: 'bg-fg-muted',
    overrides: { reviewStage: 'REVIEW_REQUIRED' },
  },
  {
    key: 'IN_REVIEW',
    label: REVIEW_TAG_LISTS[1].shortLabel,
    icon: OcticonEye,
    colorClass: 'bg-accent-emphasis',
    overrides: { reviewStage: 'IN_REVIEW' },
  },
  {
    key: 'REVIEWED',
    label: REVIEW_TAG_LISTS[2].shortLabel,
    icon: OcticonCheck,
    colorClass: 'bg-success-emphasis',
    overrides: { reviewStage: 'REVIEWED' },
  },
  {
    key: 'UNTAGGED',
    label: 'Starred, not tagged',
    icon: OcticonStar,
    colorClass: 'bg-attention-emphasis',
    overrides: { untagged: 'yes' },
  },
  {
    key: 'UNCATEGORIZED',
    label: 'Tagged, not categorized',
    icon: OcticonTag,
    colorClass: 'bg-done-emphasis',
    overrides: { uncategorized: 'yes' },
  },
  {
    key: 'DEPLOYED',
    label: DEPLOY_TAG.shortLabel,
    icon: OcticonRocket,
    colorClass: 'bg-accent-emphasis',
    overrides: { deployed: 'yes' },
  },
]
