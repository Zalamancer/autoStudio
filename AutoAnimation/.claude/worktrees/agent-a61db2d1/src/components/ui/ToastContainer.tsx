import { useToastStore, type ToastType } from '@/stores/useToastStore'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap: Record<ToastType, string> = {
  success: 'border-green-500/40 bg-green-500/10 text-green-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const Icon = iconMap[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border backdrop-blur-sm shadow-lg',
              'animate-in slide-in-from-right-5 fade-in duration-200',
              colorMap[t.type],
            )}
          >
            <Icon size={16} className={cn('shrink-0 mt-0.5', iconColorMap[t.type])} />
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
