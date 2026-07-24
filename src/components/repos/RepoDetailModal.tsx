import { useState } from 'react'
import type { Repo, StarList } from '../../types/github'
import { useAuthStore } from '../../store/authStore'
import { useStarsStore } from '../../store/starsStore'
import { useAsync } from '../../hooks/useAsync'
import { getReadme, getRepoDetails } from '../../api/rest'
import { OcticonFork, OcticonStar } from '../icons/Octicons'
import ReadmePreview from './ReadmePreview'
import ActionsMenu from './ActionsMenu'
import TagStatusModal from './TagStatusModal'
import CategoryListModal from './CategoryListModal'
import DeploymentModal from './DeploymentModal'
import NoteModal from './NoteModal'
import ConfirmDialog from '../shared/ConfirmDialog'
import Modal from '../shared/Modal'
import TabButton from '../shared/TabButton'
import RepoIssuesTab from './RepoIssuesTab'
import RepoPullRequestsTab from './RepoPullRequestsTab'
import RepoProjectsTab from './RepoProjectsTab'

type Tab = 'overview' | 'issues' | 'pullRequests' | 'projects'

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
  const [starring, setStarring] = useState(false)
  const [activeSubModal, setActiveSubModal] = useState<'tag' | 'category' | 'deploy' | 'notes' | null>(null)
  const [confirmingUnstar, setConfirmingUnstar] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  const [owner, name] = nameWithOwner.split('/')

  // Best-effort preview lookup for a repo that isn't starred yet (e.g. opened
  // from Discovery) — the modal still renders using the fallback header
  // (avatar/name derived from the URL) if this fails.
  const detailsFetcher = !storeRepo && account ? () => getRepoDetails(account.token, owner, name) : null
  const { data: fetchedRepo } = useAsync(detailsFetcher, [nameWithOwner, storeRepo, account])

  const repo = storeRepo ?? fetchedRepo
  const isStarred = Boolean(storeRepo)

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
        <Modal
          onClose={onClose}
          labelledBy="repo-detail-modal-title"
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-border-default bg-canvas shadow-xl flex flex-col"
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
                  id="repo-detail-modal-title"
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

          <div className="flex gap-1 px-4 pt-3 border-b border-border-default">
            <TabButton label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
            <TabButton label="Issues" active={tab === 'issues'} onClick={() => setTab('issues')} />
            <TabButton
              label="Pull requests"
              active={tab === 'pullRequests'}
              onClick={() => setTab('pullRequests')}
            />
            <TabButton label="Projects" active={tab === 'projects'} onClick={() => setTab('projects')} />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'overview' && account && (
              <ReadmePreview
                token={account.token}
                fetchKey={nameWithOwner}
                fetcher={(t) => getReadme(t, owner, name)}
                emptyMessage="No README found for this repository."
              />
            )}
            {tab === 'issues' && account && <RepoIssuesTab token={account.token} owner={owner} name={name} />}
            {tab === 'pullRequests' && account && (
              <RepoPullRequestsTab token={account.token} owner={owner} name={name} />
            )}
            {tab === 'projects' && account && (
              <RepoProjectsTab token={account.token} owner={owner} name={name} />
            )}
          </div>
        </Modal>
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
