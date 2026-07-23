import type { DeploymentDrift } from '../../selectors/deploymentDrift'

export default function DriftBadge({ drift }: { drift: DeploymentDrift }) {
  switch (drift.kind) {
    case 'up-to-date':
      return <span className="text-xs rounded-full bg-success-fg/10 text-success-fg px-2 py-0.5">Up to date</span>
    case 'behind':
      return (
        <span className="text-xs rounded-full bg-attention-fg/10 text-attention-fg px-2 py-0.5">
          {drift.count} {drift.unit}
          {drift.count === 1 ? '' : 's'} behind
        </span>
      )
    case 'behind-unknown':
      return (
        <span className="text-xs rounded-full bg-attention-fg/10 text-attention-fg px-2 py-0.5">
          Behind (30+ {drift.unit}s)
        </span>
      )
    case 'unknown':
      return <span className="text-xs rounded-full bg-fg-muted/10 text-fg-muted px-2 py-0.5">Unknown</span>
  }
}
