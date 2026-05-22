import { useState } from 'react'
import { X, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'
import { useOneClickAppStore } from '@/stores/useOneClickAppStore'
import type { OneClickApp, AppInputField } from '@/types/oneClickApp'

interface Props {
  app: OneClickApp
  onClose: () => void
}

function InputField({
  field,
  value,
  onChange,
}: {
  field: AppInputField
  value: any
  onChange: (value: any) => void
}) {
  if (field.type === 'text') {
    return (
      <input
        type="text"
        value={value ?? field.default ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.06] rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-green-500/50"
      />
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value ?? field.default ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.06] rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-green-500/50 resize-none"
      />
    )
  }

  if (field.type === 'select' && field.options) {
    return (
      <PanelSelect
        value={value ?? field.default ?? ''}
        onChange={(v) => onChange(v)}
        options={field.options.map((opt) => ({ value: opt.value, label: opt.label }))}
        fullWidth
      />
    )
  }

  if (field.type === 'number') {
    return (
      <PanelSlider
        label={field.label}
        value={value ?? field.default ?? 0}
        onChange={(v) => onChange(v)}
        min={(field as any).min ?? 0}
        max={(field as any).max ?? 100}
        step={(field as any).step ?? 1}
        compact
      />
    )
  }

  if (field.type === 'toggle') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'w-10 h-5 rounded-full transition-colors relative',
          value ? 'bg-green-500' : 'bg-zinc-600'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    )
  }

  if (field.type === 'image') {
    return (
      <div className="w-full px-3 py-4 bg-white/[0.06] border border-dashed border-white/10 rounded-lg text-center text-xs text-zinc-500">
        Drop image here or click to upload
      </div>
    )
  }

  return null
}

export function AppExecutionModal({ app, onClose }: Props) {
  const [inputs, setInputs] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {}
    for (const field of app.inputFields) {
      if (field.default != null) defaults[field.id] = field.default
    }
    return defaults
  })

  const execution = useOneClickAppStore((s) => s.execution)
  const executeApp = useOneClickAppStore((s) => s.executeApp)
  const clearExecution = useOneClickAppStore((s) => s.clearExecution)

  const isRunning = execution?.status === 'running' && execution.appId === app.id
  const isCompleted = execution?.status === 'completed' && execution.appId === app.id
  const isError = execution?.status === 'error' && execution.appId === app.id

  const canRun = app.inputFields
    .filter((f) => f.required)
    .every((f) => {
      const v = inputs[f.id]
      return v != null && v !== ''
    })

  const handleRun = () => {
    if (!canRun || isRunning) return
    executeApp(app, inputs)
  }

  const handleClose = () => {
    clearExecution()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{app.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{app.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input fields */}
        <div className="px-5 py-4 space-y-3 max-h-[400px] overflow-y-auto">
          {app.inputFields.map((field) => (
            <div key={field.id}>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <InputField
                field={field}
                value={inputs[field.id]}
                onChange={(val) => setInputs((prev) => ({ ...prev, [field.id]: val }))}
              />
            </div>
          ))}
        </div>

        {/* Status */}
        {isRunning && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 text-sm text-blue-400">
            <Loader2 size={14} className="animate-spin" />
            Generating...
          </div>
        )}

        {isCompleted && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 text-sm text-green-400">
            <CheckCircle size={14} />
            Complete
          </div>
        )}

        {isError && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle size={14} />
            {execution?.error ?? 'Error'}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={!canRun || isRunning}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
              canRun && !isRunning
                ? 'bg-green-500 text-black hover:bg-green-400'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            )}
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {isRunning ? 'Running...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}
