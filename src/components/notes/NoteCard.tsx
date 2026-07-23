import type { Repo } from '../../types/github'
import type { NoteRecord } from '../../types/gsmState'

export default function NoteCard({ repo, record, onOpen }: { repo: Repo; record: NoteRecord; onOpen: () => void }) {
  const preview = record.content.split('\n').find((line) => line.trim().length > 0)?.trim()

  return (
    <div
      className="border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors cursor-pointer p-4 flex flex-col gap-2"
      onClick={onOpen}
    >
      <span className="font-mono text-sm font-medium truncate block">{repo.nameWithOwner}</span>
      <p className="text-xs text-fg-muted line-clamp-2">{preview || 'Empty note'}</p>
      <span className="text-xs text-fg-muted mt-1">Updated {new Date(record.updatedAt).toLocaleDateString()}</span>
    </div>
  )
}
