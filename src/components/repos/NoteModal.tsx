import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../../store/gsmStateStore'
import { getReadme } from '../../api/rest'
import { useRecentItems } from '../../hooks/useRecentItems'
import type { Repo } from '../../types/github'
import MarkdownContent from '../shared/MarkdownContent'
import ConfirmDialog from '../shared/ConfirmDialog'
import Modal from '../shared/Modal'
import Loader from '../shared/Loader'
import ReadmePreview from './ReadmePreview'

type Tab = 'view' | 'edit' | 'readme'

export default function NoteModal({ repo, onClose }: { repo: Repo; onClose: () => void }) {
  const account = useAuthStore((s) => s.currentAccount())
  const gsm = useGsmUserState(account?.user.id ?? null)
  const setNote = useGsmStateStore((s) => s.setNote)
  const clearNote = useGsmStateStore((s) => s.clearNote)

  const record = gsm.state.repos[repo.id]?.note
  const hasNote = Boolean(record?.content)

  const [tab, setTab] = useState<Tab>(hasNote ? 'view' : 'edit')
  const [draft, setDraft] = useState(record?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (tab === 'edit') textareaRef.current?.focus()
  }, [tab])

  const { recordVisit } = useRecentItems()
  useEffect(() => {
    recordVisit({
      id: `note:${repo.nameWithOwner.toLowerCase()}`,
      type: 'note',
      name: repo.nameWithOwner,
      href: `/notes?repo=${encodeURIComponent(repo.nameWithOwner)}`,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record once per opened repo, not on every recordVisit identity change
  }, [repo.nameWithOwner])

  function handleEditClick() {
    setDraft(record?.content ?? '')
    setTab('edit')
  }

  async function handleSave() {
    if (!account || !gsm.gistId) return
    setSaving(true)
    try {
      await setNote(account.user.id, account.token, repo, draft)
      setTab('view')
    } finally {
      setSaving(false)
    }
  }

  function handleConfirmDelete() {
    if (!account || !gsm.gistId) return
    void clearNote(account.user.id, account.token, repo)
    setDraft('')
    setTab('edit')
    setConfirmingDelete(false)
  }

  return (
    <>
      <Modal
        onClose={onClose}
        labelledBy="note-modal-title"
        className="w-full max-w-5xl h-[90vh] overflow-hidden rounded-2xl border border-border-default bg-canvas shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h3 id="note-modal-title" className="text-base font-semibold">
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
          {hasNote && (
            <button
              type="button"
              onClick={() => setTab('readme')}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
                tab === 'readme'
                  ? 'bg-canvas-subtle border border-b-0 border-border-default'
                  : 'text-fg-muted'
              }`}
            >
              README
            </button>
          )}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!gsm.gistId ? (
            <Loader label="Loading your GSM:STATE gist…" />
          ) : tab === 'readme' ? (
            account && (
              <ReadmePreview
                token={account.token}
                fetchKey={repo.nameWithOwner}
                fetcher={(t) => getReadme(t, repo.owner.login, repo.name)}
                emptyMessage="No README found for this repository."
              />
            )
          ) : tab === 'view' ? (
            hasNote && record ? (
              <>
                <MarkdownContent content={record.content} />
                <p className="text-xs text-fg-muted mt-4">
                  Last updated {new Date(record.updatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-fg-muted">No note yet — switch to Edit to write one.</p>
            )
          ) : (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write markdown notes about this repo…"
              className="w-full h-full font-mono text-sm rounded-md border border-border-default bg-canvas-subtle p-3 resize-none"
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
      </Modal>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this note?"
          message={`This permanently removes your note for ${repo.name} from your GSM:STATE gist. This can't be undone.`}
          confirmLabel="Delete note"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  )
}
