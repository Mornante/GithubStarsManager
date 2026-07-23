import { useMemo } from 'react'
import { useStarredRepos } from '../hooks/useStarredRepos'
import { useGsmState } from '../hooks/useGsmState'
import { useRepoModal } from '../hooks/useRepoModal'
import NoteCard from '../components/notes/NoteCard'
import NoteModal from '../components/repos/NoteModal'

export default function NotesPage() {
  const { repos, status } = useStarredRepos()
  const { notes, status: gsmStatus, error: gsmError, retry: gsmRetry } = useGsmState()
  const { openRepoKey, openRepo, closeRepo } = useRepoModal()

  const notedRepos = useMemo(() => repos.filter((r) => Boolean(notes[r.id]?.content)), [repos, notes])
  const openRepoObj = openRepoKey
    ? repos.find((r) => r.nameWithOwner.toLowerCase() === openRepoKey.toLowerCase())
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Notes</h1>
        <p className="text-sm text-fg-muted">Freeform markdown notes you've kept against starred repos.</p>
      </div>

      {gsmStatus === 'error' && (
        <div className="rounded-md border border-danger-fg/40 bg-danger-fg/10 px-4 py-3 text-sm text-danger-fg flex items-center justify-between gap-4">
          <span>Failed to sync GSM:STATE gist: {gsmError}</span>
          <button
            type="button"
            onClick={gsmRetry}
            className="shrink-0 rounded-md border border-danger-fg/40 px-2 py-1 text-xs font-medium hover:bg-danger-fg/10"
          >
            Retry
          </button>
        </div>
      )}

      {status === 'syncing' && repos.length === 0 ? (
        <p className="text-sm text-fg-muted">Loading your starred repositories…</p>
      ) : notedRepos.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No notes yet. Open a starred repo's Actions menu and choose "Notes…" to write one.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notedRepos.map((repo) => (
            <NoteCard
              key={repo.id}
              repo={repo}
              record={notes[repo.id]}
              onOpen={() => openRepo(repo.nameWithOwner)}
            />
          ))}
        </div>
      )}

      {openRepoObj && <NoteModal repo={openRepoObj} onClose={closeRepo} />}
    </div>
  )
}
