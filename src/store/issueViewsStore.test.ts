import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware')
  return { ...actual, persist: (config: unknown) => config }
})

import { issueHasChangedSinceView, useIssueViewsStore } from './issueViewsStore'

const USER_ID = 'u1'

beforeEach(() => {
  useIssueViewsStore.setState({ byUser: {} })
})

describe('markViewed', () => {
  it('records the issue-updatedAt snapshot for a user', () => {
    useIssueViewsStore.getState().markViewed(USER_ID, 'i1', '2024-01-01T00:00:00Z')

    expect(useIssueViewsStore.getState().byUser[USER_ID]).toEqual({ i1: '2024-01-01T00:00:00Z' })
  })

  it('does not clobber other issues already recorded for the same user', () => {
    useIssueViewsStore.getState().markViewed(USER_ID, 'i1', '2024-01-01T00:00:00Z')
    useIssueViewsStore.getState().markViewed(USER_ID, 'i2', '2024-02-02T00:00:00Z')

    expect(useIssueViewsStore.getState().byUser[USER_ID]).toEqual({
      i1: '2024-01-01T00:00:00Z',
      i2: '2024-02-02T00:00:00Z',
    })
  })

  it('overwrites the snapshot when the same issue is viewed again', () => {
    useIssueViewsStore.getState().markViewed(USER_ID, 'i1', '2024-01-01T00:00:00Z')
    useIssueViewsStore.getState().markViewed(USER_ID, 'i1', '2024-03-03T00:00:00Z')

    expect(useIssueViewsStore.getState().byUser[USER_ID]).toEqual({ i1: '2024-03-03T00:00:00Z' })
  })
})

describe('issueHasChangedSinceView', () => {
  it('is false when the issue has never been viewed', () => {
    expect(issueHasChangedSinceView({}, USER_ID, 'i1', '2024-01-01T00:00:00Z')).toBe(false)
  })

  it('is false when the current updatedAt matches what was viewed', () => {
    const byUser = { [USER_ID]: { i1: '2024-01-01T00:00:00Z' } }
    expect(issueHasChangedSinceView(byUser, USER_ID, 'i1', '2024-01-01T00:00:00Z')).toBe(false)
  })

  it('is true when the issue changed since it was last viewed', () => {
    const byUser = { [USER_ID]: { i1: '2024-01-01T00:00:00Z' } }
    expect(issueHasChangedSinceView(byUser, USER_ID, 'i1', '2024-05-05T00:00:00Z')).toBe(true)
  })

  it('is false when there is no signed-in user', () => {
    const byUser = { [USER_ID]: { i1: '2024-01-01T00:00:00Z' } }
    expect(issueHasChangedSinceView(byUser, null, 'i1', '2024-05-05T00:00:00Z')).toBe(false)
  })
})
