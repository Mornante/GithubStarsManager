import { useEffect, useRef, useState } from 'react'

// Open/close state for dropdowns and popovers: closes on an outside click or
// Escape. Replaces the `onBlur` + `setTimeout(150)` hack (fragile — it relies
// on blur firing before the triggering click registers) that was duplicated
// across several dropdown components.
export function useDismissableOpen<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return { open, setOpen, ref }
}
