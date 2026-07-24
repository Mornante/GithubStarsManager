import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Read-tracking, not curated data — doesn't belong in the GSM:STATE gist
// (that's for things worth syncing across devices, like review tags/notes).
// Local-only: userId -> issueId -> the issue's own updatedAt at the moment it
// was last opened.
interface IssueViewsState {
  byUser: Record<string, Record<string, string>>
  markViewed: (userId: string, issueId: string, updatedAt: string) => void
}

export const useIssueViewsStore = create<IssueViewsState>()(
  persist(
    (set) => ({
      byUser: {},
      markViewed: (userId, issueId, updatedAt) =>
        set((state) => ({
          byUser: { ...state.byUser, [userId]: { ...(state.byUser[userId] ?? {}), [issueId]: updatedAt } },
        })),
    }),
    { name: 'gh-stars-issue-views' },
  ),
)

// Comparing the issue's own updatedAt against the snapshot taken when it was
// last viewed — both come from the same clock (GitHub's), so a plain string
// inequality is enough; no separate "viewed at" timestamp or date parsing needed.
export function issueHasChangedSinceView(
  byUser: Record<string, Record<string, string>>,
  userId: string | null,
  issueId: string,
  currentUpdatedAt: string,
): boolean {
  if (!userId) return false
  const viewedAt = byUser[userId]?.[issueId]
  return viewedAt !== undefined && viewedAt !== currentUpdatedAt
}
