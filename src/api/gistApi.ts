import { githubRest } from './githubClient'
import { emptyGsmState } from '../types/gsmState'
import type { GsmStateFile } from '../types/gsmState'
import { migrateGsmState } from './gsmStateMigrations'

const GIST_FILENAME = 'gsm-state.json'
const GIST_DESCRIPTION = 'GSM:STATE'

function snapshotFilename(version: string): string {
  return `gsm-state.snapshot-v${version}.json`
}

interface GistListItem {
  id: string
  description: string | null
  files: Record<string, { filename: string }>
}

interface GistFull {
  id: string
  description: string | null
  files: Record<string, { filename: string; content: string; truncated?: boolean }>
}

export interface GsmStateGist {
  gistId: string
  state: GsmStateFile
}

// GitHub has no "find gist by name" endpoint — we list the user's own gists and
// match by filename. Scoped to the first 100 (a single page) since this is a
// one-time bootstrap lookup for a personal account, not a repeated operation.
export async function findOrCreateGsmStateGist(token: string): Promise<GsmStateGist> {
  const gists = await githubRest<GistListItem[]>(token, '/gists?per_page=100')
  const existing = gists.find((g) => GIST_FILENAME in g.files)

  if (existing) {
    const full = await githubRest<GistFull>(token, `/gists/${existing.id}`)
    const raw = full.files[GIST_FILENAME]?.content
    if (!raw) return { gistId: existing.id, state: emptyGsmState() }

    const parsed = JSON.parse(raw) as unknown
    const { state, migratedFrom } = migrateGsmState(parsed)

    if (migratedFrom) {
      const snapshotName = snapshotFilename(migratedFrom)
      const stamped: GsmStateFile = { ...state, meta: { ...state.meta, updatedAt: new Date().toISOString() } }
      const files: Record<string, { content: string }> = {
        [GIST_FILENAME]: { content: JSON.stringify(stamped, null, 2) },
      }
      // Don't clobber a snapshot already written by a previous upgrade — the
      // first snapshot at a given version is the one worth keeping.
      if (!(snapshotName in full.files)) {
        files[snapshotName] = { content: JSON.stringify(parsed, null, 2) }
      }
      await githubRest(token, `/gists/${existing.id}`, { method: 'PATCH', body: { files } })
      return { gistId: existing.id, state: stamped }
    }

    return { gistId: existing.id, state }
  }

  const state = emptyGsmState()
  const created = await githubRest<GistFull>(token, '/gists', {
    method: 'POST',
    body: {
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } },
    },
  })
  return { gistId: created.id, state }
}

export async function writeGsmState(token: string, gistId: string, state: GsmStateFile): Promise<void> {
  await githubRest(token, `/gists/${gistId}`, {
    method: 'PATCH',
    body: { files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } } },
  })
}
