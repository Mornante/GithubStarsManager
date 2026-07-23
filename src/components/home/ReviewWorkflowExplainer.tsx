import { REVIEW_TAG_LISTS } from '../../config/reviewTags'
import { OcticonCheck, OcticonEye, OcticonRepo, OcticonStar, OcticonTag } from '../icons/Octicons'

const STEPS = [
  {
    label: 'Star',
    detail: 'Star anything that looks worth learning from',
    icon: OcticonStar,
    colorClass: 'bg-attention-emphasis',
  },
  {
    label: REVIEW_TAG_LISTS[0].shortLabel,
    detail: REVIEW_TAG_LISTS[0].description,
    icon: OcticonTag,
    colorClass: 'bg-fg-muted',
  },
  {
    label: REVIEW_TAG_LISTS[1].shortLabel,
    detail: REVIEW_TAG_LISTS[1].description,
    icon: OcticonEye,
    colorClass: 'bg-accent-emphasis',
  },
  {
    label: REVIEW_TAG_LISTS[2].shortLabel,
    detail: REVIEW_TAG_LISTS[2].description,
    icon: OcticonCheck,
    colorClass: 'bg-success-emphasis',
  },
  {
    label: 'Add to a list',
    detail: 'File it into a real, topic-based star list',
    icon: OcticonRepo,
    colorClass: 'bg-done-emphasis',
  },
]

export default function ReviewWorkflowExplainer() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">How I review stars</h2>
      <p className="text-sm text-fg-muted mb-6">
        Every repo moves through this pipeline — the review stage and deployment status are stored as JSON in a
        private <span className="font-mono text-xs">GSM:STATE</span> gist on your GitHub account, separate from
        your real star lists, which stay free for genuine topic-based collections.
      </p>

      <div className="relative">
        <div
          aria-hidden
          className="hidden sm:block absolute top-[22px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-attention-emphasis via-accent-emphasis to-done-emphasis"
        />

        <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-3">
          {STEPS.map((step) => (
            <div key={step.label} className="flex flex-col items-center text-center gap-2">
              <div
                className={`w-11 h-11 rounded-full ring-4 ring-canvas flex items-center justify-center text-white shrink-0 ${step.colorClass}`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium">{step.label}</div>
              <p className="text-xs text-fg-muted max-w-[11rem]">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
