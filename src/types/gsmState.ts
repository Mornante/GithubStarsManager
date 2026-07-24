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
  }
}
