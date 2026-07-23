import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../../store/gsmStateStore'
import { getReadme } from '../../api/rest'
import type { Repo } from '../../types/github'
import MarkdownContent from '../shared/MarkdownContent'
import ConfirmDialog from '../shared/ConfirmDialog'
import ReadmePreview from './ReadmePreview'

type Tab = 'view' | 'edit' | 'readme'

export default function NoteModal({ repo, onClose }: { repo: Repo; onClose: () => void }) {
  const account = useAuthStore((s) => s.currentAccount())
  const gsm = useGsmUserState(account?.user.id ?? null)
  const setNote = useGsmStateStore((s) => s.setNote)
  const clearNote = useGsmStateStore((s) => s.clearNote)

  const record = gsm.state.notes[repo.id]
  const hasNote = Boolean(record?.content)

  const [tab, setTab] = useState<Tab>(hasNote ? 'view' : 'edit')
  const [draft, setDraft] = useState(record?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleEditClick() {
    setDraft(record?.content ?? '')
    setTab('edit')
  }

  async function handleSave() {
    if (!account || !gsm.gistId) return
    setSaving(true)
    try {
      await setNote(account.user.id, account.token, repo.id, draft)
      setTab('view')
    } finally {
      setSaving(false)
    }
  }

  function handleConfirmDelete() {
    if (!account || !gsm.gistId) return
    void clearNote(account.user.id, account.token, repo.id)
    setDraft('')
    setTab('edit')
    setConfirmingDelete(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] overflow-hidden rounded-md border border-border-default bg-canvas flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h3 className="text-base font-semibold">
            Notes —{' '}
            <a
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {repo.name}
            </a>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-fg-muted hover:text-fg-default text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-border-default">
          <button
            type="button"
            onClick={() => setTab('view')}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
              tab === 'view' ? 'bg-canvas-subtle border border-b-0 border-border-default' : 'text-fg-muted'
            }`}
          >
            View
          </button>
          <button
            type="button"
            onClick={handleEditClick}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
              tab === 'edit' ? 'bg-canvas-subtle border border-b-0 border-border-default' : 'text-fg-muted'
            }`}
          >
            Edit
          </button>
          {hasNote && (
            <button
              type="button"
              onClick={() => setTab('readme')}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
                tab === 'readme' ? 'bg-canvas-subtle border border-b-0 border-border-default' : 'text-fg-muted'
              }`}
            >
              README
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!gsm.gistId ? (
            <p className="text-sm text-fg-muted">Loading your GSM:STATE gist…</p>
          ) : tab === 'view' ? (
            hasNote ? (
              <>
                <MarkdownContent content={record.content} />
                <p className="text-xs text-fg-muted mt-4">
                  Last updated {new Date(record.updatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-fg-muted">No note yet — switch to Edit to write one.</p>
            )
          ) : tab === 'readme' ? (
            account && (
              <ReadmePreview
                token={account.token}
                fetchKey={repo.nameWithOwner}
                fetcher={(t) => getReadme(t, repo.owner.login, repo.name)}
                emptyMessage="No README found for this repository."
              />
            )
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write markdown notes about this repo…"
              className="w-full h-full font-mono text-sm rounded-md border border-border-default bg-canvas-subtle p-3 resize-none"
              autoFocus
            />
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border-default">
          {hasNote ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-sm text-danger-fg hover:underline"
            >
              Delete note
            </button>
          ) : (
            <span />
          )}
          {tab === 'edit' && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !gsm.gistId}
              className="rounded-md bg-accent-emphasis text-white text-sm font-medium px-3 py-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this note?"
          message={`This permanently removes your note for ${repo.name} from your GSM:STATE gist. This can't be undone.`}
          confirmLabel="Delete note"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
