import { OcticonChevronUpDown, OcticonRepo, OcticonStar } from '../icons/Octicons'
import DropdownMenu, { type DropdownMenuItem } from '../shared/DropdownMenu'

export default function OrgActionsMenu({
  isFollowing,
  following,
  onFollow,
  onUnfollow,
  onOpenRepositories,
}: {
  isFollowing: boolean
  following: boolean
  onFollow: () => void
  onUnfollow: () => void
  onOpenRepositories: () => void
}) {
  const items: DropdownMenuItem[] = [
    isFollowing
      ? { key: 'unfollow', label: 'Unfollow', icon: OcticonStar, iconClassName: 'text-fg-muted', onClick: onUnfollow }
      : {
          key: 'follow',
          label: following ? 'Following…' : 'Follow',
          icon: OcticonStar,
          iconClassName: 'text-attention-fg',
          onClick: onFollow,
          disabled: following,
        },
    { key: 'repositories', label: 'Repositories…', icon: OcticonRepo, onClick: onOpenRepositories, dividerBefore: true },
  ]

  return <DropdownMenu triggerLabel="Actions" triggerIcon={OcticonChevronUpDown} items={items} />
}
