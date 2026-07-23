import type { ComponentType } from 'react'
import { useDismissableOpen } from '../../hooks/useDismissableOpen'

export interface DropdownMenuItem {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  onClick: () => void
  disabled?: boolean
  title?: string
  // Visually separates this item from the one before it (e.g. a toggle
  // action grouped apart from a list of navigation actions).
  dividerBefore?: boolean
}

export default function DropdownMenu({
  triggerLabel,
  triggerIcon: TriggerIcon,
  items,
}: {
  triggerLabel: string
  triggerIcon: ComponentType<{ className?: string }>
  items: DropdownMenuItem[]
}) {
  const { open, setOpen, ref } = useDismissableOpen<HTMLDivElement>()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-canvas-subtle"
      >
        {triggerLabel}
        <TriggerIcon className="text-fg-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 -translate-x-1/2 z-20 mt-1 w-56 rounded-md border border-border-default bg-canvas-overlay shadow-lg p-1"
        >
          {items.map((item) => (
            <div key={item.key}>
              {item.dividerBefore && <div className="border-t border-border-default my-1" />}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.title}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <item.icon className={item.iconClassName ?? 'text-fg-muted'} />
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
