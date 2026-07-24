export default function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
        active ? 'bg-canvas-subtle border border-b-0 border-border-default' : 'text-fg-muted'
      }`}
    >
      {label}
    </button>
  )
}
