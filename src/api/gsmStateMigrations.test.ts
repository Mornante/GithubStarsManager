import { describe, expect, it } from 'vitest'
import { migrateGsmState } from './gsmStateMigrations'
import { CURRENT_SCHEMA_VERSION, emptyGsmState } from '../types/gsmState'

describe('migrateGsmState', () => {
  it('folds the legacy flat schema (no schemaVersion field) into the repos map', () => {
    const legacy = {
      version: 1,
      reviewTags: { r1: 'REVIEW_REQUIRED' },
      deployments: {
        r2: {
          environment: 'production',
          deployedRef: 'v1.0.0',
          deployedRefType: 'release',
          deployedAt: '2024-01-01T00:00:00Z',
        },
      },
      notes: { r1: { content: 'hello', updatedAt: '2024-02-02T00:00:00Z' } },
    }

    const result = migrateGsmState(legacy)

    expect(result.migratedFrom).toBe('0.0.0')
    expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.state.repos).toEqual({
      r1: { reviewTag: 'REVIEW_REQUIRED', note: { content: 'hello', updatedAt: '2024-02-02T00:00:00Z' } },
      r2: {
        deployment: {
          environment: 'production',
          deployedRef: 'v1.0.0',
          deployedRefType: 'release',
          deployedAt: '2024-01-01T00:00:00Z',
        },
      },
    })
  })

  it('leaves an already-current gist as-is (no migration, no data loss)', () => {
    const current = { ...emptyGsmState(), repos: { r1: { reviewTag: 'IN_REVIEW' as const } } }

    const result = migrateGsmState(current)

    expect(result.migratedFrom).toBeNull()
    expect(result.state.repos).toEqual({ r1: { reviewTag: 'IN_REVIEW' } })
  })

  it('backfills meta/repos when an already-current gist is missing an optional field', () => {
    const result = migrateGsmState({ schemaVersion: CURRENT_SCHEMA_VERSION })

    expect(result.migratedFrom).toBeNull()
    expect(result.state.repos).toEqual({})
    expect(result.state.meta.app).toBe('GitHub Stars Manager')
  })

  it('passes through unchanged when the gist is at a version this build has no migration path from', () => {
    const fromTheFuture = { schemaVersion: '9.9.9', repos: { r1: { reviewTag: 'REVIEWED' } } }

    const result = migrateGsmState(fromTheFuture)

    expect(result.migratedFrom).toBeNull()
    expect(result.state.repos).toEqual({ r1: { reviewTag: 'REVIEWED' } })
  })

  it('treats a brand-new/empty payload as legacy and produces a valid empty current-version state', () => {
    const result = migrateGsmState({})

    expect(result.migratedFrom).toBe('0.0.0')
    expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.state.repos).toEqual({})
  })
})
