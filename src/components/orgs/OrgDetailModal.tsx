import { useEffect, useState } from 'react'
import type { Organization, Repo, StarList } from '../../types/github'
import { useAuthStore } from '../../store/authStore'
import { useOrgsStore } from '../../store/orgsStore'
import { getOrgProfileReadme } from '../../api/rest'
import { OcticonLinkExternal, OcticonPeople, OcticonRepo, OcticonStar } from '../icons/Octicons'
import ReadmePreview from '../repos/ReadmePreview'
import RepoDetailModal from '../repos/RepoDetailModal'
import Modal from '../shared/Modal'
import TabButton from '../shared/TabButton'
import OrgActionsMenu from './OrgActionsMenu'
import OrgRepositoriesTab from './OrgRepositoriesTab'
import OrgProjectsTab from './OrgProjectsTab'
import OrgPeopleTab from './OrgPeopleTab'

type Tab = 'overview' | 'repositories' | 'projects' | 'people'

export default function OrgDetailModal({
  org,
  starredRepos,
  lists,
  onClose,
}: {
  org: Organization
  starredRepos: Repo[]
  lists: StarList[]
  onClose: () => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const follow = useOrgsStore((s) => s.follow)
  const unfollow = useOrgsStore((s) => s.unfollow)
  const syncFollowStatus = useOrgsStore((s) => s.syncFollowStatus)
  const [following, setFollowing] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [openRepoKey, setOpenRepoKey] = useState<string | null>(null)

  useEffect(() => {
    if (account) void syncFollowStatus(account.user.id, account.token, org)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, org.login])

  async function handleFollow() {
    if (!account) return
    setFollowing(true)
    try {
      await follow(account.user.id, account.token, org)
    } finally {
      setFollowing(false)
    }
  }

  function handleUnfollow() {
    if (!account) return
    void unfollow(account.user.id, account.token, org)
  }

  return (
    <>
      {!openRepoKey && (
        <Modal
          onClose={onClose}
          labelledBy="org-detail-modal-title"
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-border-default bg-canvas shadow-xl flex flex-col"
        >
          <div className="border-b border-border-default p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <img src={org.avatarUrl} alt="" className="w-10 h-10 rounded-md" />
              <div className="min-w-0">
                <a
                  id="org-detail-modal-title"
                  href={org.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-lg font-semibold truncate hover:underline block"
                >
                  {org.login}
                </a>
                <div className="flex items-center gap-3 text-sm text-fg-muted mt-1 flex-wrap">
                  {org.name && <span>{org.name}</span>}
                  {org.followerCount != null && (
                    <span className="flex items-center gap-1 text-attention-fg font-medium">
                      <OcticonStar /> {org.followerCount.toLocaleString()}
                    </span>
                  )}
                  {org.repoCount != null && (
                    <span className="flex items-center gap-1">
                      <OcticonRepo /> {org.repoCount.toLocaleString()}
                    </span>
                  )}
                  {org.memberCount != null && (
                    <span className="flex items-center gap-1">
                      <OcticonPeople /> {org.memberCount.toLocaleString()}
                    </span>
                  )}
                  {org.location && <span>{org.location}</span>}
                  {org.websiteUrl && (
                    <a
                      href={org.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-accent-fg hover:underline"
                    >
                      <OcticonLinkExternal /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <OrgActionsMenu
                isFollowing={org.viewerIsFollowing}
                following={following}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
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
            <TabButton
              label="Repositories"
              active={tab === 'repositories'}
              onClick={() => setTab('repositories')}
            />
            <TabButton label="Projects" active={tab === 'projects'} onClick={() => setTab('projects')} />
            <TabButton label="People" active={tab === 'people'} onClick={() => setTab('people')} />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'overview' && account && (
              <ReadmePreview
                token={account.token}
                fetchKey={org.login}
                fetcher={(t) => getOrgProfileReadme(t, org.login)}
                emptyMessage="This organization doesn't have a profile README."
              />
            )}
            {tab === 'repositories' && account && (
              <OrgRepositoriesTab
                token={account.token}
                login={org.login}
                starredRepos={starredRepos}
                lists={lists}
                onOpenRepo={setOpenRepoKey}
              />
            )}
            {tab === 'projects' && account && <OrgProjectsTab token={account.token} login={org.login} />}
            {tab === 'people' && account && <OrgPeopleTab token={account.token} login={org.login} />}
          </div>
        </Modal>
      )}

      {openRepoKey && (
        <RepoDetailModal
          nameWithOwner={openRepoKey}
          repos={starredRepos}
          lists={lists}
          onClose={() => setOpenRepoKey(null)}
        />
      )}
    </>
  )
}
