import { create } from 'zustand'

type ToastVariant = 'error' | 'success' | 'info'

type Toast = {
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

export function toast(message: string, variant: ToastVariant = 'info') {
  useToastStore.getState().push(message, variant)
}

const variantClasses: Record<ToastVariant, string> = {
  error: 'bg-red-600 text-white border-red-700',
  success: 'bg-emerald-600 text-white border-emerald-700',
  info: 'bg-slate-800 text-white border-slate-900',
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-md border px-4 py-3 shadow-lg text-sm cursor-pointer ${variantClasses[t.variant]}`}
          onClick={() => dismiss(t.id)}
          role="alert"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
