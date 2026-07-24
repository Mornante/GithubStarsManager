import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { findOrCreateGsmStateGist, writeGsmState } from '../api/gistApi'
import { GithubApiError } from '../api/githubClient'
import { useToastStore } from './toastStore'
import { emptyGsmState } from '../types/gsmState'
import type { GsmStateFile, ReviewStage, DeploymentRecord, RepoState } from '../types/gsmState'

interface UserGsmState {
  gistId: string | null
  state: GsmStateFile
}

// What every store action needs to identify and label a repo entry — a
// structural subset of `Repo`, kept local so this store doesn't have to
// import the whole github types module for two fields.
export interface RepoRef {
  id: string
  nameWithOwner: string
}

type SyncStatus = 'idle' | 'loading' | 'error'

interface GsmStateStoreShape {
  byUser: Record<string, UserGsmState>
  status: SyncStatus
  error: string | null
  load: (userId: string, token: string) => Promise<void>
  setReviewTag: (userId: string, token: string, repo: RepoRef, stage: ReviewStage | null) => Promise<void>
  setDeployment: (userId: string, token: string, repo: RepoRef, record: DeploymentRecord) => Promise<void>
  clearDeployment: (userId: string, token: string, repo: RepoRef) => Promise<void>
  setNote: (userId: string, token: string, repo: RepoRef, content: string) => Promise<void>
  clearNote: (userId: string, token: string, repo: RepoRef) => Promise<void>
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

// Sets a single field on a repo's entry (creating the entry if needed),
// stamping/refreshing `nameWithOwner` on every write so the raw gist stays
// human-readable even for repos the app has only ever seen an id for.
function withRepoField<K extends 'reviewTag' | 'deployment' | 'note'>(
  repos: Record<string, RepoState>,
  repo: RepoRef,
  field: K,
  value: NonNullable<RepoState[K]>,
): Record<string, RepoState> {
  return { ...repos, [repo.id]: { ...repos[repo.id], nameWithOwner: repo.nameWithOwner, [field]: value } }
}

// Removes a single field from a repo's entry, dropping the entry entirely
// once none of the real data fields (reviewTag/deployment/note) remain.
function withoutRepoField(
  repos: Record<string, RepoState>,
  repoId: string,
  field: 'reviewTag' | 'deployment' | 'note',
): Record<string, RepoState> {
  const existing = repos[repoId]
  if (!existing) return repos
  const rest: RepoState = { ...existing }
  delete rest[field]
  const hasOtherData =
    rest.reviewTag !== undefined || rest.deployment !== undefined || rest.note !== undefined
  const next = { ...repos }
  if (hasOtherData) next[repoId] = rest
  else delete next[repoId]
  return next
}

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

      setReviewTag: async (userId, token, repo, stage) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextRepos = stage
          ? withRepoField(before.state.repos, repo, 'reviewTag', stage)
          : withoutRepoField(before.state.repos, repo.id, 'reviewTag')
        const nextState: GsmStateFile = { ...before.state, repos: nextRepos }

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

      setDeployment: async (userId, token, repo, record) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextState: GsmStateFile = {
          ...before.state,
          repos: withRepoField(before.state.repos, repo, 'deployment', record),
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

      clearDeployment: async (userId, token, repo) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextState: GsmStateFile = {
          ...before.state,
          repos: withoutRepoField(before.state.repos, repo.id, 'deployment'),
        }

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

      setNote: async (userId, token, repo, content) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const record = { content, updatedAt: new Date().toISOString() }
        const nextState: GsmStateFile = {
          ...before.state,
          repos: withRepoField(before.state.repos, repo, 'note', record),
        }

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

      clearNote: async (userId, token, repo) => {
        const before = get().byUser[userId] ?? emptyUserGsm
        if (!before.gistId) return
        const nextState: GsmStateFile = {
          ...before.state,
          repos: withoutRepoField(before.state.repos, repo.id, 'note'),
        }

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
      // Backfills any GsmStateFile field that didn't exist yet when this
      // user's state was cached (e.g. a gist read before "meta" existed) so
      // old local caches never leave a field undefined. The gist itself gets
      // upgraded through migrateGsmState on the next `load`; this is only
      // about not crashing on the locally-cached copy before that happens.
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
