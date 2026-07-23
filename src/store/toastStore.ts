import { create } from 'zustand'

interface Toast {
  id: string
  message: string
}

interface ToastState {
  toasts: Toast[]
  show: (message: string) => void
  dismiss: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (message) => {
    const id = String(++nextId)
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => get().dismiss(id), 3000)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
