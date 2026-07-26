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

// One entry per starred repo the user has touched. `nameWithOwner` is
// denormalized purely so a human opening the raw gist can tell which repo an
// entry belongs to without cross-referencing the GitHub API — `repos`' own
// key (the repo's numeric GitHub id) stays the source of truth since it
// survives renames.
export interface RepoState {
  nameWithOwner?: string
  reviewTag?: ReviewStage
  deployment?: DeploymentRecord
  note?: NoteRecord
}

// Bump this whenever GsmStateFile's shape changes, and add a matching step to
// MIGRATIONS in gsmStateMigrations.ts describing how to get from the previous
// version to this one. findOrCreateGsmStateGist() detects a gist written at
// an older version automatically, snapshots the pre-migration content into
// its own file inside the same gist, then rewrites the live file at the new
// version — no user action required, and the snapshot is there to recover
// from if the new version turns out to have a bug.
export const CURRENT_SCHEMA_VERSION = '1.0.0'

const REPO_URL = 'https://github.com/Mornante/GithubStarsManager'

// The permanent JSON payload stored in the user's "GSM:STATE" gist — the
// single source of truth for cross-device app data that isn't a real GitHub
// object (star, list, follow). New custom-data features should add fields to
// RepoState (if per-repo) or here at the top level (if global) rather than
// inventing another storage mechanism.
export type RecentItemType = 'repo' | 'org' | 'deployment' | 'note' | 'issue'

// One "recently visited" entry, tracked as a cross-device MRU list. `id` is
// the dedup/reorder key (`${type}:${lowercased-key}`) — revisiting the same
// item updates its visitedAt and moves it to the front instead of creating a
// duplicate row. `external` marks hrefs that must open in a new tab (e.g. an
// issue's GitHub URL) rather than an in-app route.
export interface RecentItem {
  id: string
  type: RecentItemType
  name: string
  href: string
  external?: boolean
  visitedAt: string
}

export const MAX_RECENT_ITEMS = 100
export const RECENT_ITEMS_NAV_LIMIT = 6

export interface GsmStateFile {
  $schema: string
  kind: 'GSM:STATE'
  schemaVersion: string
  meta: {
    app: string
    repository: string
    notice: string
    updatedAt: string
  }
  repos: Record<string, RepoState>
  recentItems: RecentItem[]
}

export function emptyGsmState(): GsmStateFile {
  return {
    $schema: `${REPO_URL}/blob/main/schema/gsm-state.schema.json`,
    kind: 'GSM:STATE',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      app: 'GitHub Stars Manager',
      repository: REPO_URL,
      notice:
        "This file is managed automatically by GitHub Stars Manager — don't edit it by hand. Visit the repository above to see what created it.",
      updatedAt: new Date().toISOString(),
    },
    repos: {},
    recentItems: [],
  }
}
