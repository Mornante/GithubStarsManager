import { useState } from 'react'
import { OcticonChevronUpDown, OcticonRepo, OcticonStar } from '../icons/Octicons'

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
  const [open, setOpen] = useState(false)

  function runAndClose(action: () => void) {
    action()
    setOpen(false)
  }

  return (
    <div className="relative" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-canvas-subtle"
      >
        Actions
        <OcticonChevronUpDown className="text-fg-muted" />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 mt-1 w-56 rounded-md border border-border-default bg-canvas-overlay shadow-lg p-1">
          {!isFollowing && (
            <button
              type="button"
              disabled={following}
              onClick={() => runAndClose(onFollow)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-50"
            >
              <OcticonStar className="text-attention-fg" />
              {following ? 'Following…' : 'Follow'}
            </button>
          )}
          {isFollowing && (
            <button
              type="button"
              onClick={() => runAndClose(onUnfollow)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle"
            >
              <OcticonStar className="text-fg-muted" />
              Unfollow
            </button>
          )}

          <div className="border-t border-border-default my-1" />

          <button
            type="button"
            onClick={() => runAndClose(onOpenRepositories)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle"
          >
            <OcticonRepo className="text-fg-muted" />
            Repositories…
          </button>
        </div>
      )}
    </div>
  )
}
