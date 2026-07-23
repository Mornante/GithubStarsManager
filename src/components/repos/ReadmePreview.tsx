import { useEffect, useState } from 'react'
import MarkdownContent from '../shared/MarkdownContent'

export default function ReadmePreview({
  token,
  fetchKey,
  fetcher,
  emptyMessage = 'No README found.',
}: {
  token: string
  fetchKey: string
  fetcher: (token: string) => Promise<string | null>
  emptyMessage?: string
}) {
  const [content, setContent] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    setContent(undefined)
    let cancelled = false
    fetcher(token).then((readme) => {
      if (!cancelled) setContent(readme)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fetchKey])

  if (content === undefined) {
    return <p className="text-sm text-fg-muted">Loading README…</p>
  }

  if (content === null) {
    return <p className="text-sm text-fg-muted">{emptyMessage}</p>
  }

  return <MarkdownContent content={content} />
}
