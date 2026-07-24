import { CURRENT_SCHEMA_VERSION, emptyGsmState } from '../types/gsmState'
import type { DeploymentRecord, GsmStateFile, NoteRecord, ReviewStage, RepoState } from '../types/gsmState'

// The shape written before schema versioning existed: a flat "version: 1"
// file with one Record<repoId, X> per feature instead of a single
// repo-keyed map. Detected whenever a gist has no `schemaVersion` field.
const LEGACY_VERSION = '0.0.0'

interface LegacyGsmStateV1 {
  version: 1
  reviewTags?: Record<string, ReviewStage>
  deployments?: Record<string, DeploymentRecord>
  notes?: Record<string, NoteRecord>
}

interface MigrationStep {
  from: string
  to: string
  migrate: (raw: unknown) => Partial<GsmStateFile>
}

// Add one entry here every time CURRENT_SCHEMA_VERSION moves forward,
// describing how to turn the previous shape into the new one. migrateGsmState
// below chains as many steps as it takes to reach the latest version, and the
// caller (findOrCreateGsmStateGist) snapshots the pre-migration content
// before writing anything back — so adding a step here is the only thing a
// future schema change needs to do to get automatic, safe upgrades.
const MIGRATIONS: MigrationStep[] = [
  {
    from: LEGACY_VERSION,
    to: '1.0.0',
    migrate: (raw) => {
      const legacy = raw as LegacyGsmStateV1
      const repoIds = new Set([
        ...Object.keys(legacy.reviewTags ?? {}),
        ...Object.keys(legacy.deployments ?? {}),
        ...Object.keys(legacy.notes ?? {}),
      ])
      const repos: Record<string, RepoState> = {}
      for (const id of repoIds) {
        const entry: RepoState = {}
        const reviewTag = legacy.reviewTags?.[id]
        const deployment = legacy.deployments?.[id]
        const note = legacy.notes?.[id]
        if (reviewTag) entry.reviewTag = reviewTag
        if (deployment) entry.deployment = deployment
        if (note) entry.note = note
        repos[id] = entry
      }
      return { schemaVersion: '1.0.0', repos }
    },
  },
]

function detectSchemaVersion(raw: unknown): string {
  const schemaVersion = (raw as { schemaVersion?: unknown } | undefined)?.schemaVersion
  return typeof schemaVersion === 'string' ? schemaVersion : LEGACY_VERSION
}

function mergeWithDefaults(raw: unknown): GsmStateFile {
  const empty = emptyGsmState()
  const partial = (raw ?? {}) as Partial<GsmStateFile>
  return {
    ...empty,
    ...partial,
    meta: { ...empty.meta, ...partial.meta },
    repos: partial.repos ?? {},
  }
}

export interface MigrationResult {
  state: GsmStateFile
  // Non-null only when a migration chain actually ran to completion — the
  // caller uses this both as the snapshot's version label and as the signal
  // that the gist needs rewriting. Null means "used as-is", which covers two
  // very different cases: the gist is already current, or it's at a version
  // this build doesn't recognize (e.g. written by a newer build, then opened
  // by an older one) — in the latter case we deliberately don't guess at a
  // migration and don't touch the gist.
  migratedFrom: string | null
}

export function migrateGsmState(raw: unknown): MigrationResult {
  const detected = detectSchemaVersion(raw)
  if (detected === CURRENT_SCHEMA_VERSION) {
    return { state: mergeWithDefaults(raw), migratedFrom: null }
  }

  let cursor = detected
  let data: unknown = raw
  while (cursor !== CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === cursor)
    if (!step) return { state: mergeWithDefaults(raw), migratedFrom: null }
    data = step.migrate(data)
    cursor = step.to
  }

  return { state: mergeWithDefaults(data), migratedFrom: detected }
}
