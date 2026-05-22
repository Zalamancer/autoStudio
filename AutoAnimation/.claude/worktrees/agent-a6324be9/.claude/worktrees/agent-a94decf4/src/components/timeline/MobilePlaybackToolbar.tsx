/**
 * Compact floating playback toolbar for mobile.
 * Provides play/pause, frame step, undo/redo, and delete — replacing
 * keyboard shortcuts (Space, arrows, Delete) that have no mobile equivalent.
 */
import { memo, useCallback } from 'react'
import { SkipBack, Play, Pause, SkipForward, Undo2, Redo2 } from 'lucide-react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { TemporalState } from 'zundo'

export const MobilePlaybackToolbar = memo(function MobilePlaybackToolbar() {
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const togglePlayback = useTimelineStore((s) => s.togglePlayback)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)

  const { undo, redo, canUndo, canRedo } = useStore(
    useTimelineStore.temporal,
    useShallow((state: TemporalState<unknown>) => ({
      undo: state.undo,
      redo: state.redo,
      canUndo: state.pastStates.length > 0,
      canRedo: state.futureStates.length > 0,
    })),
  )

  const stepBack = useCallback(() => {
    const frame = useTimelineStore.getState().currentFrame
    seekToFrame(Math.max(0, frame - 1))
  }, [seekToFrame])
  const stepForward = useCallback(() => {
    const { currentFrame: frame, totalFrames: total } = useTimelineStore.getState()
    seekToFrame(Math.min(total - 1, frame + 1))
  }, [seekToFrame])

  return (
    <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-700/50">
      {/* Undo */}
      <ToolbarButton onClick={() => canUndo && undo()} disabled={!canUndo} title="Undo">
        <Undo2 size={16} />
      </ToolbarButton>

      {/* Skip to start */}
      <ToolbarButton onClick={() => seekToFrame(0)} title="Go to start">
        <SkipBack size={16} />
      </ToolbarButton>

      {/* Step back */}
      <ToolbarButton onClick={stepBack} title="Step back 1 frame">
        <SkipBack size={14} />
      </ToolbarButton>

      {/* Play / Pause */}
      <button
        onClick={togglePlayback}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-400 text-black transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      {/* Step forward */}
      <ToolbarButton onClick={stepForward} title="Step forward 1 frame">
        <SkipForward size={14} />
      </ToolbarButton>

      {/* Skip to end */}
      <ToolbarButton onClick={() => seekToFrame(totalFrames - 1)} title="Go to end">
        <SkipForward size={16} />
      </ToolbarButton>

      {/* Redo */}
      <ToolbarButton onClick={() => canRedo && redo()} disabled={!canRedo} title="Redo">
        <Redo2 size={16} />
      </ToolbarButton>
    </div>
  )
})

function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  )
}
