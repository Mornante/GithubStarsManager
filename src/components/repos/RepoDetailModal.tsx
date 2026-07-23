import { useEffect, useState } from 'react'
import type { Repo, StarList } from '../../types/github'
import { useAuthStore } from '../../store/authStore'
import { useStarsStore } from '../../store/starsStore'
import { getReadme, getRepoDetails } from '../../api/rest'
import { OcticonFork, OcticonStar } from '../icons/Octicons'
import ReadmePreview from './ReadmePreview'
import ActionsMenu from './ActionsMenu'
import TagStatusModal from './TagStatusModal'
import CategoryListModal from './CategoryListModal'
import DeploymentModal from './DeploymentModal'
import NoteModal from './NoteModal'
import ConfirmDialog from '../shared/ConfirmDialog'

export default function RepoDetailModal({
  nameWithOwner,
  repos,
  lists,
  onClose,
}: {
  nameWithOwner: string
  repos: Repo[]
  lists: StarList[]
  onClose: () => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const starRepo = useStarsStore((s) => s.starRepo)
  const unstarRepo = useStarsStore((s) => s.unstarRepo)

  const storeRepo = repos.find((r) => r.nameWithOwner.toLowerCase() === nameWithOwner.toLowerCase())
  const [fetchedRepo, setFetchedRepo] = useState<Repo | null>(null)
  const [starring, setStarring] = useState(false)
  const [activeSubModal, setActiveSubModal] = useState<'tag' | 'category' | 'deploy' | 'notes' | null>(null)
  const [confirmingUnstar, setConfirmingUnstar] = useState(false)

  const [owner, name] = nameWithOwner.split('/')
  const repo = storeRepo ?? fetchedRepo
  const isStarred = Boolean(storeRepo)

  useEffect(() => {
    if (storeRepo || !account) return
    let cancelled = false
    getRepoDetails(account.token, owner, name).then((details) => {
      if (!cancelled) setFetchedRepo(details)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameWithOwner, storeRepo, account])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleStar() {
    if (!account) return
    setStarring(true)
    try {
      await starRepo(account.user.id, account.token, owner, name)
    } finally {
      setStarring(false)
    }
  }

  function handleConfirmUnstar() {
    if (!account || !repo) return
    void unstarRepo(account.user.id, account.token, repo.id, owner, name)
    setConfirmingUnstar(false)
  }

  return (
    <>
      {!activeSubModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-md border border-border-default bg-canvas flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border-default p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={repo?.owner.avatarUrl ?? `https://github.com/${owner}.png`}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div className="min-w-0">
                  <a
                    href={repo?.url ?? `https://github.com/${nameWithOwner}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-lg font-semibold truncate hover:underline block"
                  >
                    {nameWithOwner}
                  </a>
                  {repo && (
                    <div className="flex items-center gap-3 text-sm text-fg-muted mt-1">
                      <span className="flex items-center gap-1">
                        <OcticonStar /> {repo.stargazerCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <OcticonFork /> {repo.forkCount.toLocaleString()}
                      </span>
                      {repo.licenseInfo && <span>{repo.licenseInfo.spdxId ?? repo.licenseInfo.name}</span>}
                      {repo.primaryLanguage && <span>{repo.primaryLanguage.name}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <ActionsMenu
                  isStarred={isStarred}
                  starring={starring}
                  onStar={handleStar}
                  onUnstar={() => setConfirmingUnstar(true)}
                  onOpenTag={() => setActiveSubModal('tag')}
                  onOpenCategory={() => setActiveSubModal('category')}
                  onOpenDeploy={() => setActiveSubModal('deploy')}
                  onOpenNotes={() => setActiveSubModal('notes')}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-fg-muted hover:text-fg-default text-xl leading-none px-1"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {account && (
                <ReadmePreview
                  token={account.token}
                  fetchKey={nameWithOwner}
                  fetcher={(t) => getReadme(t, owner, name)}
                  emptyMessage="No README found for this repository."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubModal === 'tag' && repo && (
        <TagStatusModal repo={repo} onClose={() => setActiveSubModal(null)} />
      )}
      {activeSubModal === 'category' && repo && (
        <CategoryListModal repo={repo} lists={lists} onClose={() => setActiveSubModal(null)} />
      )}
      {activeSubModal === 'deploy' && repo && (
        <DeploymentModal repo={repo} onClose={() => setActiveSubModal(null)} />
      )}
      {activeSubModal === 'notes' && repo && (
        <NoteModal repo={repo} onClose={() => setActiveSubModal(null)} />
      )}

      {confirmingUnstar && repo && (
        <ConfirmDialog
          title="Un-star this repo?"
          message={`This removes ${repo.nameWithOwner} from your starred repos on GitHub. Any tags, notes, or deployment tracking for it will no longer be visible until you star it again.`}
          confirmLabel="Un-star"
          onConfirm={handleConfirmUnstar}
          onCancel={() => setConfirmingUnstar(false)}
        />
      )}
    </>
  )
}
