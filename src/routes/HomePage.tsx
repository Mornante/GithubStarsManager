import { useStarredRepos } from '../hooks/useStarredRepos'
import { useAuthStore } from '../store/authStore'
import ReviewWorkflowExplainer from '../components/home/ReviewWorkflowExplainer'
import FeatureHighlights from '../components/home/FeatureHighlights'

export default function HomePage() {
  const { repos, status, error, retry } = useStarredRepos()
  const account = useAuthStore((s) => s.currentAccount())
  const firstName = account?.user.name?.split(' ')[0] ?? account?.user.login

  return (
    <div className="space-y-8">
      {status === 'syncing' && repos.length === 0 && (
        <p className="text-sm text-fg-muted">Loading your starred repositories…</p>
      )}
      {status === 'error' && (
        <div className="rounded-md border border-danger-fg/40 bg-danger-fg/10 px-4 py-3 text-sm text-danger-fg flex items-center justify-between gap-4">
          <span>Failed to sync with GitHub: {error}</span>
          <button
            type="button"
            onClick={retry}
            className="shrink-0 rounded-md border border-danger-fg/40 px-2 py-1 text-xs font-medium hover:bg-danger-fg/10"
          >
            Retry
          </button>
        </div>
      )}

      <section className="flex flex-col items-center text-center gap-4 py-10">
        <div className="rounded-full bg-gradient-to-b from-accent-fg/15 to-transparent p-2">
          <img
            src="https://octodex.github.com/images/original.png"
            alt="Octocat"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-canvas-subtle shadow-xl shadow-accent-fg/10 object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-accent-fg mb-1">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-accent-fg to-done-fg bg-clip-text text-transparent">
            GitHub Stars Manager
          </h1>
          <p className="text-sm md:text-base text-fg-muted max-w-xl mx-auto mt-3">
            Your personal command center for the repos you star — instead of letting them pile up as forgotten
            bookmarks, review each one, file it away on purpose, and keep discovering what's next.
          </p>
        </div>
      </section>

      <FeatureHighlights />

      <ReviewWorkflowExplainer />
    </div>
  )
}
