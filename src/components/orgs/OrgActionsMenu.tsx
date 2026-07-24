import { OcticonStar } from '../icons/Octicons'

// Repositories used to be a second item here, opening a separate modal — now
// that it's a tab in OrgDetailModal directly, Follow/Unfollow is the only
// action left, so a one-item dropdown would just be an extra click for no
// benefit. A plain toggle button instead.
export default function OrgActionsMenu({
  isFollowing,
  following,
  onFollow,
  onUnfollow,
}: {
  isFollowing: boolean
  following: boolean
  onFollow: () => void
  onUnfollow: () => void
}) {
  return (
    <button
      type="button"
      disabled={!isFollowing && following}
      onClick={isFollowing ? onUnfollow : onFollow}
      className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-canvas-subtle disabled:opacity-50"
    >
      <OcticonStar className={isFollowing ? 'text-fg-muted' : 'text-attention-fg'} />
      {isFollowing ? 'Unfollow' : following ? 'Following…' : 'Follow'}
    </button>
  )
}
