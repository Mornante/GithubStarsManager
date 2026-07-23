import { useEffect, useState } from 'react'
import type { Organization, Repo, StarList } from '../../types/github'
import { useAuthStore } from '../../store/authStore'
import { useOrgsStore } from '../../store/orgsStore'
import { getOrgProfileReadme } from '../../api/rest'
import { OcticonLinkExternal, OcticonPeople, OcticonRepo, OcticonStar } from '../icons/Octicons'
import ReadmePreview from '../repos/ReadmePreview'
import OrgActionsMenu from './OrgActionsMenu'
import OrgRepositoriesModal from './OrgRepositoriesModal'

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
  const [showRepos, setShowRepos] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

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
      {!showRepos && (
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
                <img src={org.avatarUrl} alt="" className="w-10 h-10 rounded-md" />
                <div className="min-w-0">
                  <a
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
                  onOpenRepositories={() => setShowRepos(true)}
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
                  fetchKey={org.login}
                  fetcher={(t) => getOrgProfileReadme(t, org.login)}
                  emptyMessage="This organization doesn't have a profile README."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showRepos && (
        <OrgRepositoriesModal
          org={org}
          starredRepos={starredRepos}
          lists={lists}
          onClose={() => setShowRepos(false)}
        />
      )}
    </>
  )
}
