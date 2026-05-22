/**
 * Animation tab content for the unified Rig Editor Panel.
 *
 * Single dropdown to pick animation tool, content renders below.
 * Action button sticky at bottom.
 */
import { useState, lazy, Suspense } from 'react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { RigAnimationGeneratorPanel } from './RigAnimationGeneratorPanel'
import { MotionTrackingPanel } from './MotionTrackingPanel'
import { MotionCapturePanel } from './MotionCapturePanel'
import { LiveAvatarPanel } from './LiveAvatarPanel'

const DeepMotionPanel = lazy(() => import('./DeepMotionPanel').then((m) => ({ default: m.DeepMotionPanel })))

// ─── Tool definitions ────────────────────────────────────────────────────────

interface AnimTool {
  id: string
  label: string
  badge?: string
  modes: ('2d' | '3d')[]
}

const ANIM_TOOLS: AnimTool[] = [
  { id: 'mocap-video', label: 'Motion Capture (Video)', modes: ['2d', '3d'] },
  { id: 'ai-animation', label: 'AI Animation', modes: ['2d'] },
  { id: 'perform', label: 'Perform (Webcam)', modes: ['2d'] },
  { id: 'live-avatar', label: 'Live Avatar', modes: ['3d'] },
  { id: 'deepmotion', label: 'DeepMotion', badge: 'PRO', modes: ['2d', '3d'] },
]

// ─── Animation Tab ───────────────────────────────────────────────────────────

export default function RigEditorAnimationTab({ mode }: { mode: '2d' | '3d' }) {
  const availableTools = ANIM_TOOLS.filter((t) => t.modes.includes(mode))
  const [activeToolId, setActiveToolId] = useState(availableTools[0]?.id ?? 'mocap-video')

  const toolOptions = availableTools.map((t) => ({
    value: t.id,
    label: t.badge ? `${t.label} (${t.badge})` : t.label,
  }))

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tool selector */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <PanelSelect value={activeToolId} options={toolOptions} onChange={setActiveToolId} fullWidth />
      </div>

      {/* Active tool content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeToolId === 'mocap-video' && <MotionCapturePanel mode={mode} />}
        {activeToolId === 'ai-animation' && <RigAnimationGeneratorPanel />}
        {activeToolId === 'perform' && <MotionTrackingPanel />}
        {activeToolId === 'live-avatar' && <LiveAvatarPanel />}
        {activeToolId === 'deepmotion' && (
          <Suspense
            fallback={<div className="flex items-center justify-center py-8 text-zinc-500 text-xs">Loading...</div>}
          >
            <DeepMotionPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}
