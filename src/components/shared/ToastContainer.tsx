import { useToastStore } from '../../store/toastStore'
import { OcticonCheck } from '../icons/Octicons'

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 rounded-md bg-fg-default text-canvas text-sm px-4 py-2.5 shadow-lg"
        >
          <OcticonCheck className="text-success-fg shrink-0" />
          {toast.message}
        </div>
      ))}
    </div>
  )
}
