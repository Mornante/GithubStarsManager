import { useAuthStore } from '../../store/authStore'
import { useStarsStore } from '../../store/starsStore'
import { legacySystemListIds } from '../../selectors/reviewTagSelectors'
import type { Repo, StarList } from '../../types/github'
import Modal from '../shared/Modal'

export default function CategoryListModal({
  repo,
  lists,
  onClose,
}: {
  repo: Repo
  lists: StarList[]
  onClose: () => void
}) {
  const account = useAuthStore((s) => s.currentAccount())
  const addToList = useStarsStore((s) => s.addToList)
  const removeFromList = useStarsStore((s) => s.removeFromList)

  const tagIds = legacySystemListIds(lists)
  const categoryLists = lists.filter((l) => !tagIds.has(l.id))

  function toggle(listId: string, isMember: boolean) {
    if (!account) return
    if (isMember) void removeFromList(account.user.id, account.token, repo.id, listId)
    else void addToList(account.user.id, account.token, repo.id, listId)
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="category-list-modal-title"
      className="w-full max-w-md rounded-2xl border border-border-default bg-canvas shadow-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 id="category-list-modal-title" className="text-base font-semibold">
          Add to category
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

      {categoryLists.length === 0 ? (
        <p className="text-sm text-fg-muted">You don't have any non-tag star lists yet.</p>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {categoryLists.map((list) => {
            const isMember = repo.listIds.includes(list.id)
            return (
              <label
                key={list.id}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle cursor-pointer"
              >
                <input type="checkbox" checked={isMember} onChange={() => toggle(list.id, isMember)} />
                <span className="truncate">{list.name}</span>
              </label>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
