import { Link } from 'react-router-dom'
import {
  OcticonChevronDown,
  OcticonNote,
  OcticonOrganization,
  OcticonRocket,
  OcticonSearch,
} from '../icons/Octicons'

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
      <h2 className="text-lg font-display font-semibold mb-1">Your toolkit</h2>
      <p className="text-sm text-fg-muted mb-6">Search, follow, track, and annotate — all in one place.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="group border border-border-default rounded-xl bg-canvas-subtle hover:border-accent-fg hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${feature.colorClass}`}
              >
                <feature.icon className="w-5 h-5" />
              </span>
              <OcticonChevronDown className="-rotate-90 text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm font-medium">{feature.label}</span>
            <p className="text-xs text-fg-muted">{feature.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
