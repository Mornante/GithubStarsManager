import {
  OcticonCheck,
  OcticonChevronUpDown,
  OcticonNote,
  OcticonRocket,
  OcticonStar,
  OcticonTag,
} from '../icons/Octicons'
import DropdownMenu, { type DropdownMenuItem } from '../shared/DropdownMenu'

export default function ActionsMenu({
  isStarred,
  starring,
  onStar,
  onUnstar,
  onOpenTag,
  onOpenCategory,
  onOpenDeploy,
  onOpenNotes,
}: {
  isStarred: boolean
  starring: boolean
  onStar: () => void
  onUnstar: () => void
  onOpenTag: () => void
  onOpenCategory: () => void
  onOpenDeploy: () => void
  onOpenNotes: () => void
}) {
  const requiresStarTitle = !isStarred ? 'Star this repo first' : undefined

  const items: DropdownMenuItem[] = [
    isStarred
      ? {
          key: 'unstar',
          label: 'Un-star',
          icon: OcticonStar,
          iconClassName: 'text-fg-muted',
          onClick: onUnstar,
        }
      : {
          key: 'star',
          label: starring ? 'Starring…' : 'Star',
          icon: OcticonStar,
          iconClassName: 'text-attention-fg',
          onClick: onStar,
          disabled: starring,
        },
    {
      key: 'tag',
      label: 'Tag…',
      icon: OcticonTag,
      onClick: onOpenTag,
      disabled: !isStarred,
      title: requiresStarTitle,
      dividerBefore: true,
    },
    {
      key: 'category',
      label: 'Add to category…',
      icon: OcticonCheck,
      onClick: onOpenCategory,
      disabled: !isStarred,
      title: requiresStarTitle,
    },
    {
      key: 'deploy',
      label: 'Deploy…',
      icon: OcticonRocket,
      onClick: onOpenDeploy,
      disabled: !isStarred,
      title: requiresStarTitle,
    },
    {
      key: 'notes',
      label: 'Notes…',
      icon: OcticonNote,
      onClick: onOpenNotes,
      disabled: !isStarred,
      title: requiresStarTitle,
    },
  ]

  return <DropdownMenu triggerLabel="Actions" triggerIcon={OcticonChevronUpDown} items={items} />
}
