import { useState } from 'react'
import { OcticonCheck, OcticonChevronUpDown, OcticonNote, OcticonRocket, OcticonStar, OcticonTag } from '../icons/Octicons'

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
          {!isStarred && (
            <button
              type="button"
              disabled={starring}
              onClick={() => runAndClose(onStar)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-50"
            >
              <OcticonStar className="text-attention-fg" />
              {starring ? 'Starring…' : 'Star'}
            </button>
          )}
          {isStarred && (
            <button
              type="button"
              onClick={() => runAndClose(onUnstar)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle"
            >
              <OcticonStar className="text-fg-muted" />
              Un-star
            </button>
          )}

          <div className="border-t border-border-default my-1" />

          <button
            type="button"
            disabled={!isStarred}
            title={!isStarred ? 'Star this repo first' : undefined}
            onClick={() => runAndClose(onOpenTag)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <OcticonTag className="text-fg-muted" />
            Tag…
          </button>
          <button
            type="button"
            disabled={!isStarred}
            title={!isStarred ? 'Star this repo first' : undefined}
            onClick={() => runAndClose(onOpenCategory)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <OcticonCheck className="text-fg-muted" />
            Add to category…
          </button>
          <button
            type="button"
            disabled={!isStarred}
            title={!isStarred ? 'Star this repo first' : undefined}
            onClick={() => runAndClose(onOpenDeploy)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <OcticonRocket className="text-fg-muted" />
            Deploy…
          </button>
          <button
            type="button"
            disabled={!isStarred}
            title={!isStarred ? 'Star this repo first' : undefined}
            onClick={() => runAndClose(onOpenNotes)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <OcticonNote className="text-fg-muted" />
            Notes…
          </button>
        </div>
      )}
    </div>
  )
}
