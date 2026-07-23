const SPINNER_SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'w-3.5 h-3.5 border-2',
  md: 'w-5 h-5 border-2',
}

// Single shared loading indicator for every async wait in the app (initial
// page loads, gist/README fetches, pagination "load more"). The spinner ring
// is theme-driven — border-border-default/border-t-accent-fg resolve to the
// same CSS variables that flip between light and dark in index.css, so it
// never needs its own light/dark handling.
export default function Loader({
  label,
  size = 'md',
  className = '',
}: {
  label?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <output className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className={`inline-block shrink-0 animate-spin rounded-full border-border-default border-t-accent-fg ${SPINNER_SIZE_CLASSES[size]}`}
      />
      <span className={label ? 'text-sm text-fg-muted' : 'sr-only'}>{label ?? 'Loading…'}</span>
    </output>
  )
}
