import { useAsync } from '../../hooks/useAsync'
import MarkdownContent from '../shared/MarkdownContent'
import Loader from '../shared/Loader'

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
  const { data: content, loading } = useAsync(() => fetcher(token), [token, fetchKey])

  if (loading) {
    return <Loader label="Loading README…" />
  }

  if (content === null) {
    return <p className="text-sm text-fg-muted">{emptyMessage}</p>
  }

  return <MarkdownContent content={content} />
}
