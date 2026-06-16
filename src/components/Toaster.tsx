import { useToastStore, type ToastVariant } from '@/lib/toast'

const variantClasses: Record<ToastVariant, string> = {
  error: 'bg-red-600 text-white border-red-700',
  success: 'bg-emerald-600 text-white border-emerald-700',
  info: 'bg-slate-800 text-white border-slate-900',
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
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
