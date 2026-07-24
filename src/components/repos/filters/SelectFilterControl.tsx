import type { FilterControlProps } from '../../../types/filters'
import { OcticonChevronDown } from '../../icons/Octicons'

export default function SelectFilterControl({
  value,
  options = [],
  onChange,
}: FilterControlProps<string | null>) {
  return (
    <div className="relative w-36">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full appearance-none text-sm rounded-md border border-border-default bg-canvas pl-3 pr-7 py-1.5"
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {opt.count !== undefined ? ` (${opt.count})` : ''}
          </option>
        ))}
      </select>
      <OcticonChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted" />
    </div>
  )
}
