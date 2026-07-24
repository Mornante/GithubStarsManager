import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStarredRepos } from '../hooks/useStarredRepos'
import { useGsmState } from '../hooks/useGsmState'
import { useAuthStore } from '../store/authStore'
import { filterRepos } from '../selectors/filterRepos'
import ReviewWorkflowExplainer from '../components/home/ReviewWorkflowExplainer'
import FeatureHighlights from '../components/home/FeatureHighlights'
import Loader from '../components/shared/Loader'
import { OcticonTag } from '../components/icons/Octicons'

export default function HomePage() {
  const { repos, lists, status, error, retry } = useStarredRepos()
  const { reviewTags, deployments } = useGsmState()
  const account = useAuthStore((s) => s.currentAccount())
  const firstName = account?.user.name?.split(' ')[0] ?? account?.user.login

  const reviewRequiredCount = useMemo(
    () => filterRepos(repos, { reviewStage: 'REVIEW_REQUIRED' }, { lists, reviewTags, deployments }).length,
    [repos, lists, reviewTags, deployments],
  )

  return (
    <div className="space-y-8">
      {status === 'syncing' && repos.length === 0 && <Loader label="Loading your starred repositories…" />}
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

      <section className="relative overflow-hidden rounded-2xl">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-fg/15 via-transparent to-done-fg/15 blur-2xl"
        />

        <div className="relative flex flex-col items-center text-center gap-4 py-10">
          <div className="rounded-full bg-gradient-to-b from-accent-fg/15 to-transparent p-2 motion-safe:animate-pulse">
            <img
              src="https://octodex.github.com/images/original.png"
              alt="Octocat"
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-canvas-subtle shadow-xl shadow-accent-fg/10 object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-accent-fg mb-1">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-accent-fg to-done-fg bg-clip-text text-transparent">
              GitHub Stars Manager
            </h1>
            <p className="text-sm md:text-base text-fg-muted max-w-xl mx-auto mt-3">
              Your command center for the repos you star — review each one, file it away on purpose, and keep
              discovering what's next.
            </p>
          </div>

          <Link
            to={reviewRequiredCount > 0 ? '/repos?reviewStage=REVIEW_REQUIRED' : '/repos'}
            className="inline-flex items-center gap-2 rounded-full border border-border-default bg-canvas-subtle px-4 py-2 text-sm font-medium hover:border-accent-fg transition-colors"
          >
            <OcticonTag className="text-attention-fg" />
            {reviewRequiredCount > 0 ? (
              <>
                {reviewRequiredCount} repo{reviewRequiredCount === 1 ? '' : 's'} waiting for review
              </>
            ) : (
              "You're all caught up — no repos waiting for review"
            )}
          </Link>
        </div>
      </section>

      <FeatureHighlights />
      <ReviewWorkflowExplainer
        repos={repos}
        lists={lists}
        reviewTags={reviewTags}
        deployments={deployments}
      />
    </div>
  )
}
