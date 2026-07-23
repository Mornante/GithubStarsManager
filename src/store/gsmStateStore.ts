import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { findOrCreateGsmStateGist, writeGsmState } from '../api/gistApi'
import { GithubApiError } from '../api/githubClient'
import { useToastStore } from './toastStore'
import { emptyGsmState } from '../types/gsmState'
import type { GsmStateFile, ReviewStage, DeploymentRecord, NoteRecord } from '../types/gsmState'

interface UserGsmState {
  gistId: string | null
  state: GsmStateFile
}

type SyncStatus = 'idle' | 'loading' | 'error'

interface GsmStateStoreShape {
  byUser: Record<string, UserGsmState>
  status: SyncStatus
  error: string | null
  load: (userId: string, token: string) => Promise<void>
  setReviewTag: (userId: string, token: string, repoId: string, stage: ReviewStage | null) => Promise<void>
  setDeployment: (userId: string, token: string, repoId: string, record: DeploymentRecord) => Promise<void>
  clearDeployment: (userId: string, token: string, repoId: string) => Promise<void>
  setNote: (userId: string, token: string, repoId: string, content: string) => Promise<void>
  clearNote: (userId: string, token: string, repoId: string) => Promise<void>
}

function toast(message: string) {
  useToastStore.getState().show(message)
}

// A 403 here almost always means the connected token predates (or was
// recreated without) the "gist" scope that findOrCreateGsmStateGist's
// /gists calls require — surface that directly instead of a generic
// "403 Forbidden" the user has no way to act on.
function describeLoadError(err: unknown): string {
  if (err instanceof GithubApiError && err.status === 403) {
    return 'Your token is missing the "gist" scope needed for GSM:STATE (tags, deployments, notes). Add that scope to your personal access token and reconnect.'
  }
  return err instanceof Error ? err.message : 'Failed to load GSM:STATE gist'
}

const emptyUserGsm: UserGsmState = { gistId: null, state: emptyGsmState() }

export const useGsmStateStore = create<GsmStateStoreShape>()(
  persist(
    (set, get) => ({
      byUser: {},
      status: 'idle',
      error: null,

      load: async (userId, token) => {
        set({ status: 'loading', error: null })
        try {
          const { gistId, state } = await findOrCreateGsmStateGist(token)
          set((s) => ({ byUser: { ...s.byUser, [userId]: { gistId, state } }, status: 'idle' }))
        } catch (err) {
          set({ status: 'error', error: describeLoadError(err) })
        }
      },

      setReviewTag: async (userId, token, repoId, stage) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextReviewTags = { ...before.state.reviewTags }
        if (stage) nextReviewTags[repoId] = stage
        else delete nextReviewTags[repoId]
        const nextState: GsmStateFile = { ...before.state, reviewTags: nextReviewTags }

        set((s) => ({ byUser: { ...s.byUser, [userId]: { ...before, state: nextState } } }))
        try {
          await writeGsmState(token, before.gistId, nextState)
          toast(stage ? `Tagged as ${stage.replace('_', ' ').toLowerCase()}` : 'Removed tag')
        } catch (err) {
          set((s) => ({
            byUser: { ...s.byUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to save tag to GSM:STATE gist',
          }))
        }
      },

      setDeployment: async (userId, token, repoId, record) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextState: GsmStateFile = {
          ...before.state,
          deployments: { ...before.state.deployments, [repoId]: record },
        }

        set((s) => ({ byUser: { ...s.byUser, [userId]: { ...before, state: nextState } } }))
        try {
          await writeGsmState(token, before.gistId, nextState)
          toast(`Marked as deployed to ${record.environment}`)
        } catch (err) {
          set((s) => ({
            byUser: { ...s.byUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to save deployment to GSM:STATE gist',
          }))
        }
      },

      clearDeployment: async (userId, token, repoId) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextDeployments = { ...before.state.deployments }
        delete nextDeployments[repoId]
        const nextState: GsmStateFile = { ...before.state, deployments: nextDeployments }

        set((s) => ({ byUser: { ...s.byUser, [userId]: { ...before, state: nextState } } }))
        try {
          await writeGsmState(token, before.gistId, nextState)
          toast('Removed deployment record')
        } catch (err) {
          set((s) => ({
            byUser: { ...s.byUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to remove deployment from GSM:STATE gist',
          }))
        }
      },

      setNote: async (userId, token, repoId, content) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const record: NoteRecord = { content, updatedAt: new Date().toISOString() }
        const nextState: GsmStateFile = { ...before.state, notes: { ...before.state.notes, [repoId]: record } }

        set((s) => ({ byUser: { ...s.byUser, [userId]: { ...before, state: nextState } } }))
        try {
          await writeGsmState(token, before.gistId, nextState)
          toast('Note saved')
        } catch (err) {
          set((s) => ({
            byUser: { ...s.byUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to save note to GSM:STATE gist',
          }))
        }
      },

      clearNote: async (userId, token, repoId) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextNotes = { ...before.state.notes }
        delete nextNotes[repoId]
        const nextState: GsmStateFile = { ...before.state, notes: nextNotes }

        set((s) => ({ byUser: { ...s.byUser, [userId]: { ...before, state: nextState } } }))
        try {
          await writeGsmState(token, before.gistId, nextState)
          toast('Note deleted')
        } catch (err) {
          set((s) => ({
            byUser: { ...s.byUser, [userId]: before },
            error: err instanceof Error ? err.message : 'Failed to delete note from GSM:STATE gist',
          }))
        }
      },
    }),
    {
      name: 'gh-stars-gsm-state',
      // Backfills any GsmStateFile field that didn't exist yet when this user's
      // state was cached (e.g. "notes", added after some users already had a
      // persisted gist) so old local caches never leave a field undefined.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GsmStateStoreShape> | undefined
        if (!persisted?.byUser) return { ...currentState, ...persisted }
        const byUser = Object.fromEntries(
          Object.entries(persisted.byUser).map(([userId, u]) => [
            userId,
            { ...u, state: { ...emptyGsmState(), ...u.state } },
          ]),
        )
        return { ...currentState, ...persisted, byUser }
      },
    },
  ),
)

export function useGsmUserState(userId: string | null): UserGsmState {
  return useGsmStateStore((s) => (userId ? (s.byUser[userId] ?? emptyUserGsm) : emptyUserGsm))
}
