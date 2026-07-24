import { Link } from 'react-router-dom'
import { OcticonNote, OcticonOrganization, OcticonRocket, OcticonSearch } from '../icons/Octicons'

const FEATURES = [
  {
    to: '/discovery',
    label: 'Discovery',
    icon: OcticonSearch,
    colorClass: 'bg-accent-emphasis',
    description:
      'Browse trending repos and search GitHub for your next favorite project, without leaving the app.',
  },
  {
    to: '/organizations',
    label: 'Organizations',
    icon: OcticonOrganization,
    colorClass: 'bg-done-emphasis',
    description: 'Follow the orgs you care about and browse everything they publish in one place.',
  },
  {
    to: '/deployments',
    label: 'Deployments',
    icon: OcticonRocket,
    colorClass: 'bg-success-emphasis',
    description:
      "Track what's deployed where, and get a heads-up the moment a newer release or commit lands.",
  },
  {
    to: '/notes',
    label: 'Notes',
    icon: OcticonNote,
    colorClass: 'bg-attention-emphasis',
    description:
      'Keep freeform markdown notes against any starred repo, right next to its README for reference.',
  },
]

export default function FeatureHighlights() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">What's new</h2>
      <p className="text-sm text-fg-muted mb-6">
        A few tools to help you get more out of the repos you star.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="border border-border-default rounded-md bg-canvas-subtle hover:border-accent-fg transition-colors p-4 flex flex-col gap-2"
          >
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${feature.colorClass}`}
            >
              <feature.icon className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium">{feature.label}</span>
            <p className="text-xs text-fg-muted">{feature.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
