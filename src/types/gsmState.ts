export type ReviewStage = 'REVIEW_REQUIRED' | 'IN_REVIEW' | 'REVIEWED'

export interface DeploymentRecord {
  environment: string
  deployedRef: string
  deployedRefType: 'release' | 'commit'
  deployedAt: string
}

export interface NoteRecord {
  content: string
  updatedAt: string
}

// The permanent JSON payload stored in the user's "GSM:STATE" gist — the single
// source of truth for cross-device app data that isn't a real GitHub object
// (star, list, follow). New custom-data features should add fields here rather
// than inventing another storage mechanism.
export interface GsmStateFile {
  version: 1
  reviewTags: Record<string, ReviewStage>
  deployments: Record<string, DeploymentRecord>
  notes: Record<string, NoteRecord>
}

export function emptyGsmState(): GsmStateFile {
  return { version: 1, reviewTags: {}, deployments: {}, notes: {} }
}
