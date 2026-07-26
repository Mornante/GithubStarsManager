import type { ComponentType } from 'react'
import {
  OcticonIssueOpened,
  OcticonNote,
  OcticonOrganization,
  OcticonRepo,
  OcticonRocket,
} from '../components/icons/Octicons'
import type { RecentItemType } from '../types/gsmState'

// The extensibility point for new trackable item types: add one entry here
// (plus a `recordVisit` call at the place the item gets opened) and the
// sidebar section + history page pick it up automatically.
export const RECENT_ITEM_ICON: Record<RecentItemType, ComponentType<{ className?: string }>> = {
  repo: OcticonRepo,
  org: OcticonOrganization,
  deployment: OcticonRocket,
  note: OcticonNote,
  issue: OcticonIssueOpened,
}

export const RECENT_ITEM_LABEL: Record<RecentItemType, string> = {
  repo: 'Repository',
  org: 'Organization',
  deployment: 'Deployment',
  note: 'Note',
  issue: 'Issue',
}
