import Modal from './Modal'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      onClose={onCancel}
      overlayZIndexClassName="z-[60]"
      labelledBy="confirm-dialog-title"
      className="w-full max-w-sm rounded-2xl border border-border-default bg-canvas shadow-xl p-6"
    >
      <h3 id="confirm-dialog-title" className="text-base font-semibold mb-2">
        {title}
      </h3>
      <p className="text-sm text-fg-muted mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-canvas-subtle"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-danger-emphasis text-white text-sm font-medium px-3 py-1.5 hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
