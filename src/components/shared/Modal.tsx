import { useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  onClose,
  className,
  labelledBy,
  children,
  overlayZIndexClassName = 'z-50',
}: {
  onClose: () => void
  className?: string
  labelledBy?: string
  children: ReactNode
  // ConfirmDialog stacks on top of whichever modal opened it (z-50), so it
  // needs a higher overlay z-index of its own.
  overlayZIndexClassName?: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const content = contentRef.current
    // Skip stealing focus if something inside already has it — e.g. a form
    // field rendered with its own `autoFocus` — since that already ran by the
    // time this effect fires (autoFocus is applied during commit, before
    // passive effects).
    if (content && !content.contains(document.activeElement)) {
      const initialFocusable = content.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(initialFocusable ?? content).focus()
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !content) return

      const items = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    // Click-outside-to-dismiss is a convenience on top of the Escape handler
    // above (the real keyboard-accessible close path) and the visible Close
    // button every caller renders — not a control of its own that needs a
    // keyboard equivalent.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={`fixed inset-0 ${overlayZIndexClassName} flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}
      onClick={onClose}
    >
      {/*
        A native <dialog> would satisfy jsx-a11y/prefer-tag-over-role, but it
        trades this conditional-render pattern for an imperative
        showModal()/close() ref API across all 8 call sites — a larger change
        than this pass covers. role="dialog" + aria-modal is the documented
        fallback for exactly this case.
      */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={contentRef}
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
