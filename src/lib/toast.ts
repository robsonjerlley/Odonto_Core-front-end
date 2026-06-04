import { create } from 'zustand'

export type ToastVariant = 'error' | 'success' | 'info'

export type Toast = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastStore = {
  toasts: Toast[]
  push: (message: string, variant?: ToastVariant) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Dispara um toast a partir de qualquer lugar (inclusive fora de componentes). */
export function toast(message: string, variant: ToastVariant = 'info') {
  useToastStore.getState().push(message, variant)
}
