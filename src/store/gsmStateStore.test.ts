import { beforeEach, describe, expect, it, vi } from 'vitest'

// `var` (not `let`/`const`): vitest hoists the `vi.mock` factory below to the very
// top of the module, ahead of this declaration's textual position, so a
// block-scoped binding would still be in its temporal dead zone when the
// factory first runs during `gsmStateStore`'s own `persist(...)` call.
var capturedMerge: ((persistedState: unknown, currentState: unknown) => unknown) | undefined

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware')
  return {
    ...actual,
    // Strip persistence (no localStorage in this test environment), but keep
    // a handle on the `merge` option so its backfill behavior can be tested directly.
    persist: (config: unknown, options: { merge?: typeof capturedMerge }) => {
      capturedMerge = options.merge
      return config
    },
  }
})

vi.mock('../api/gistApi', () => ({ findOrCreateGsmStateGist: vi.fn(), writeGsmState: vi.fn() }))

import { findOrCreateGsmStateGist, writeGsmState } from '../api/gistApi'
import { GithubApiError } from '../api/githubClient'
import { useGsmStateStore } from './gsmStateStore'
import { emptyGsmState } from '../types/gsmState'

const USER_ID = 'u1'
const TOKEN = 'token'
const REPO = { id: 'r1', nameWithOwner: 'octo/hello-world' }

beforeEach(() => {
  vi.clearAllMocks()
  useGsmStateStore.setState({ byUser: {}, status: 'idle', error: null })
})

describe('setReviewTag', () => {
  it('optimistically tags the repo, stamping its name, then persists it', async () => {
    useGsmStateStore.setState({ byUser: { [USER_ID]: { gistId: 'g1', state: emptyGsmState() } } })
    vi.mocked(writeGsmState).mockResolvedValue(undefined)

    await useGsmStateStore.getState().setReviewTag(USER_ID, TOKEN, REPO, 'REVIEW_REQUIRED')

    expect(useGsmStateStore.getState().byUser[USER_ID].state.repos).toEqual({
      r1: { nameWithOwner: 'octo/hello-world', reviewTag: 'REVIEW_REQUIRED' },
    })
    expect(writeGsmState).toHaveBeenCalledWith(
      TOKEN,
      'g1',
      expect.objectContaining({ repos: { r1: { nameWithOwner: 'octo/hello-world', reviewTag: 'REVIEW_REQUIRED' } } }),
    )
  })

  it('drops the repo entry entirely when untagging leaves no other data', async () => {
    const before = {
      gistId: 'g1',
      state: { ...emptyGsmState(), repos: { r1: { nameWithOwner: 'octo/hello-world', reviewTag: 'IN_REVIEW' as const } } },
    }
    useGsmStateStore.setState({ byUser: { [USER_ID]: before } })
    vi.mocked(writeGsmState).mockResolvedValue(undefined)

    await useGsmStateStore.getState().setReviewTag(USER_ID, TOKEN, REPO, null)

    expect(useGsmStateStore.getState().byUser[USER_ID].state.repos).toEqual({})
  })

  it('keeps the repo entry when untagging leaves other data (e.g. a note)', async () => {
    const before = {
      gistId: 'g1',
      state: {
        ...emptyGsmState(),
        repos: {
          r1: {
            nameWithOwner: 'octo/hello-world',
            reviewTag: 'IN_REVIEW' as const,
            note: { content: 'keep me', updatedAt: '2024-01-01T00:00:00Z' },
          },
        },
      },
    }
    useGsmStateStore.setState({ byUser: { [USER_ID]: before } })
    vi.mocked(writeGsmState).mockResolvedValue(undefined)

    await useGsmStateStore.getState().setReviewTag(USER_ID, TOKEN, REPO, null)

    expect(useGsmStateStore.getState().byUser[USER_ID].state.repos.r1).toEqual({
      nameWithOwner: 'octo/hello-world',
      note: { content: 'keep me', updatedAt: '2024-01-01T00:00:00Z' },
    })
  })

  it('rolls back to the previous state when the write fails', async () => {
    const before = {
      gistId: 'g1',
      state: { ...emptyGsmState(), repos: { r1: { nameWithOwner: 'octo/hello-world', reviewTag: 'IN_REVIEW' as const } } },
    }
    useGsmStateStore.setState({ byUser: { [USER_ID]: before } })
    vi.mocked(writeGsmState).mockRejectedValue(new Error('gist write failed'))

    await useGsmStateStore.getState().setReviewTag(USER_ID, TOKEN, REPO, 'REVIEWED')

    expect(useGsmStateStore.getState().byUser[USER_ID]).toEqual(before)
    expect(useGsmStateStore.getState().error).toBe('gist write failed')
  })

  it('does nothing when the gist has not loaded yet', async () => {
    await useGsmStateStore.getState().setReviewTag(USER_ID, TOKEN, REPO, 'REVIEWED')
    expect(writeGsmState).not.toHaveBeenCalled()
  })
})

describe('setDeployment', () => {
  it('optimistically records the deployment, then persists it', async () => {
    useGsmStateStore.setState({ byUser: { [USER_ID]: { gistId: 'g1', state: emptyGsmState() } } })
    vi.mocked(writeGsmState).mockResolvedValue(undefined)
    const record = { environment: 'production', deployedRef: 'v1.0.0', deployedRefType: 'release' as const, deployedAt: '2024-01-01T00:00:00Z' }

    await useGsmStateStore.getState().setDeployment(USER_ID, TOKEN, REPO, record)

    expect(useGsmStateStore.getState().byUser[USER_ID].state.repos.r1).toEqual({
      nameWithOwner: 'octo/hello-world',
      deployment: record,
    })
  })
})

describe('load', () => {
  it('populates the user state from the found/created gist', async () => {
    const state = { ...emptyGsmState(), repos: { r1: { reviewTag: 'REVIEWED' as const } } }
    vi.mocked(findOrCreateGsmStateGist).mockResolvedValue({ gistId: 'g1', state })

    await useGsmStateStore.getState().load(USER_ID, TOKEN)

    expect(useGsmStateStore.getState().byUser[USER_ID]).toEqual({ gistId: 'g1', state })
    expect(useGsmStateStore.getState().status).toBe('idle')
  })

  it('sets an error status when the gist lookup fails', async () => {
    vi.mocked(findOrCreateGsmStateGist).mockRejectedValue(new Error('unauthorized'))

    await useGsmStateStore.getState().load(USER_ID, TOKEN)

    expect(useGsmStateStore.getState().status).toBe('error')
    expect(useGsmStateStore.getState().error).toBe('unauthorized')
  })

  it('explains a 403 as a missing "gist" token scope, not a generic forbidden error', async () => {
    vi.mocked(findOrCreateGsmStateGist).mockRejectedValue(
      new GithubApiError('GitHub REST request failed: 403 Forbidden', 403),
    )

    await useGsmStateStore.getState().load(USER_ID, TOKEN)

    expect(useGsmStateStore.getState().status).toBe('error')
    expect(useGsmStateStore.getState().error).toContain('gist')
    expect(useGsmStateStore.getState().error).toMatch(/scope/)
  })
})

describe('persisted state merge (backfill)', () => {
  it('spreads persisted state over current state when there is no byUser yet', () => {
    const currentState = { byUser: {}, status: 'idle', error: null }
    const result = capturedMerge?.({ status: 'error' }, currentState)
    expect(result).toEqual({ byUser: {}, status: 'error', error: null })
  })

  it('backfills fields missing from an older cached gist state', () => {
    const currentState = { byUser: {}, status: 'idle', error: null }
    const persisted = {
      byUser: {
        [USER_ID]: { gistId: 'g1', state: { schemaVersion: '1.0.0', repos: { r1: { reviewTag: 'REVIEW_REQUIRED' } } } },
      },
    }

    const result = capturedMerge?.(persisted, currentState) as typeof currentState & {
      byUser: Record<string, { gistId: string | null; state: ReturnType<typeof emptyGsmState> }>
    }

    expect(result.byUser[USER_ID].state.repos).toEqual({ r1: { reviewTag: 'REVIEW_REQUIRED' } })
    expect(result.byUser[USER_ID].state.kind).toBe('GSM:STATE')
  })
})
