import type { FilterControlProps } from '../../../types/filters'
import { useDismissableOpen } from '../../../hooks/useDismissableOpen'
import { OcticonChevronDown } from '../../icons/Octicons'

export default function MultiSelectFilterControl({ value, options = [], onChange }: FilterControlProps<string[]>) {
  const { open, setOpen, ref } = useDismissableOpen<HTMLDivElement>()
  const selected = value ?? []

  function toggle(optionValue: string) {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue))
    } else {
      onChange([...selected, optionValue])
    }
  }

  return (
    <div ref={ref} className="relative w-36">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-sm rounded-md border border-border-default bg-canvas pl-3 pr-2 py-1.5 hover:bg-canvas-subtle text-left"
      >
        <span className="truncate">{selected.length > 0 ? `${selected.length} selected` : 'Any'}</span>
        <OcticonChevronDown className="shrink-0 text-fg-muted" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-56 max-h-64 overflow-auto rounded-md border border-border-default bg-canvas-overlay shadow-lg p-1">
          {options.length === 0 && <p className="text-xs text-fg-muted px-2 py-1">No options available</p>}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.count !== undefined && <span className="text-xs text-fg-muted">{opt.count}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
