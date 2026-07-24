import { useAuthStore } from '../../store/authStore'
import { useGsmStateStore, useGsmUserState } from '../../store/gsmStateStore'
import { REVIEW_TAG_LISTS, type ReviewTagDef } from '../../config/reviewTags'
import type { Repo } from '../../types/github'
import { OcticonCheck, OcticonEye, OcticonTag } from '../icons/Octicons'
import Modal from '../shared/Modal'

const STEP_ICONS = { REVIEW_REQUIRED: OcticonTag, IN_REVIEW: OcticonEye, REVIEWED: OcticonCheck }
const STEP_COLORS = {
  REVIEW_REQUIRED: 'bg-fg-muted',
  IN_REVIEW: 'bg-accent-emphasis',
  REVIEWED: 'bg-success-emphasis',
}

export default function TagStatusModal({ repo, onClose }: { repo: Repo; onClose: () => void }) {
  const account = useAuthStore((s) => s.currentAccount())
  const setReviewTag = useGsmStateStore((s) => s.setReviewTag)
  const gsm = useGsmUserState(account?.user.id ?? null)

  const activeKey = gsm.state.repos[repo.id]?.reviewTag
  const disabled = !gsm.gistId

  function handleClick(def: ReviewTagDef) {
    if (!account || !gsm.gistId) return
    const nextKey = activeKey === def.key ? null : def.key
    void setReviewTag(account.user.id, account.token, repo, nextKey)
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="tag-status-modal-title"
      className="w-full max-w-md rounded-2xl border border-border-default bg-canvas shadow-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 id="tag-status-modal-title" className="text-base font-semibold">
          Tag review status
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-fg-muted hover:text-fg-default text-xl leading-none px-1"
        >
          ×
        </button>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="absolute top-[22px] left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-fg-muted via-accent-emphasis to-success-emphasis"
        />
        <div className="relative grid grid-cols-3 gap-3">
          {REVIEW_TAG_LISTS.map((def) => {
            const Icon = STEP_ICONS[def.key]
            const isActive = activeKey === def.key
            return (
              <button
                key={def.key}
                type="button"
                disabled={disabled}
                title={disabled ? 'Loading GSM:STATE…' : undefined}
                onClick={() => handleClick(def)}
                className="flex flex-col items-center text-center gap-2 disabled:opacity-40"
              >
                <span
                  className={`w-11 h-11 rounded-full ring-4 ring-canvas flex items-center justify-center text-white shrink-0 ${STEP_COLORS[def.key]} ${
                    isActive ? 'outline outline-2 outline-offset-2 outline-fg-default' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{def.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-fg-muted mt-6">
        Click the current stage again to remove the tag entirely. Switching stages removes the old tag and applies
        the new one. Saved to your GSM:STATE gist.
      </p>
    </Modal>
  )
}
