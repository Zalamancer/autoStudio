/**
 * Camera Panel — Controls for virtual camera animation.
 *
 * Provides enable/disable toggle and preset grid.
 * Keyframe editing is handled in the right panel CameraPropertiesPanel.
 */

import { useEffect } from 'react'
import { Camera, Grid3x3, SlidersHorizontal } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useCameraStore, CAMERA_PRESETS } from '@/stores/useCameraStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { PanelLayout } from '@/components/ui/PanelHeader'

import { cn } from '@/lib/utils'

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider flex items-center gap-2 uppercase">
          <Icon size={14} className="text-zinc-500" />
          {title}
        </h4>
      </div>
      <div className="space-y-4 p-3 bg-zinc-800/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner">
        {children}
      </div>
    </div>
  )
}

export function CameraPanel() {
  const {
    enabled,
    activePresetId,
    setEnabled,
    applyPreset,
  } = useCameraStore(
    useShallow((s) => ({
      enabled: s.enabled,
      activePresetId: s.activePresetId,
      setEnabled: s.setEnabled,
      applyPreset: s.applyPreset,
    }))
  )

  const totalFrames = useTimelineStore((s) => s.totalFrames)

  // Show camera properties in right panel when this tab is active
  useEffect(() => {
    useEditorStore.getState().setRightPanelTab('camera-properties')
  }, [])

  return (
    <PanelLayout
      icon={Camera}
      title="Camera"
      iconClassName="text-sky-400"
      footer={
        <button
          onClick={() => useEditorStore.getState().setRightPanelTab('camera-properties')}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/25 hover:bg-sky-500/25 hover:border-sky-500/40 transition-all"
        >
          <SlidersHorizontal size={13} />
          Properties
        </button>
      }
    >
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Camera size={16} className={enabled ? 'text-sky-400' : 'text-zinc-500'} />
          <span className="text-xs font-medium text-zinc-300">Virtual Camera</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors duration-200',
            enabled ? 'bg-sky-500' : 'bg-zinc-700'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {enabled && (
        <Section icon={Grid3x3} title="Presets">
          <div className="grid grid-cols-2 gap-1.5">
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id, totalFrames)}
                className={cn(
                  'py-2 px-2.5 rounded-xl text-[10px] font-medium transition-all duration-200 text-left',
                  activePresetId === preset.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-black/20 text-zinc-400 border border-white/5 hover:border-sky-500/30 hover:text-zinc-200'
                )}
              >
                <div className="font-semibold text-[11px]">{preset.name}</div>
                <div className="text-[9px] text-zinc-500 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </Section>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
