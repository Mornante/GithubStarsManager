// The review workflow's stage data lives in the GSM:STATE gist (see
// store/gsmStateStore.ts), keyed by repo id — this config just labels the stages.
export interface ReviewTagDef {
  key: 'REVIEW_REQUIRED' | 'IN_REVIEW' | 'REVIEWED'
  shortLabel: string
  description: string
}

export const REVIEW_TAG_LISTS: ReviewTagDef[] = [
  {
    key: 'REVIEW_REQUIRED',
    shortLabel: 'Review required',
    description: 'Newly starred repos waiting to be reviewed',
  },
  {
    key: 'IN_REVIEW',
    shortLabel: 'In review',
    description: 'Repos currently being read through',
  },
  {
    key: 'REVIEWED',
    shortLabel: 'Reviewed',
    description: 'Finished reviewing, ready to file into a real list',
  },
]
