import { useEffect, useState } from 'react'
import type { FilterControlProps } from '../../../types/filters'
import { OcticonSearch } from '../../icons/Octicons'

export default function SearchFilterControl({ value, onChange }: FilterControlProps<string>) {
  const [local, setLocal] = useState(value ?? '')

  useEffect(() => setLocal(value ?? ''), [value])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (local !== value) onChange(local)
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local])

  return (
    <div className="relative w-full max-w-md">
      <OcticonSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search your starred repos…"
        className="w-full pl-10 pr-4 py-2.5 text-lg text-center rounded-full border border-border-default bg-canvas-subtle focus:outline-none focus:ring-2 focus:ring-accent-fg focus:bg-canvas"
      />
    </div>
  )
}
