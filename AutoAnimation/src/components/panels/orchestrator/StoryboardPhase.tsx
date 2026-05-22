/**
 * StoryboardPhase — Visual storyboard grid shown between plan review and execution.
 *
 * Users can review scene thumbnails, dialogue text, character positions,
 * and duration indicators before committing to full execution.
 */
import { useState, useMemo, useCallback } from 'react'
import {
  Play,
  Clock,
  MessageSquare,
  Smile,
  Pencil,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeSvg } from '@/services/sanitize'
import type { StoryboardScene } from '@/types/orchestrator'
import { generateStoryboardFromPlan } from '@/services/orchestrator/storyboardGenerator'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'

interface StoryboardPhaseProps {
  onExecute: () => void
  onBack: () => void
}

const EMOTION_COLORS: Record<string, string> = {
  joy: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  anger: 'bg-red-500/20 text-red-300 border-red-500/30',
  sadness: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  fear: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  surprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  disgust: 'bg-green-500/20 text-green-300 border-green-500/30',
  neutral: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
}

function getEmotionClass(emotion: string): string {
  const lower = emotion.toLowerCase()
  for (const [key, cls] of Object.entries(EMOTION_COLORS)) {
    if (lower.includes(key)) return cls
  }
  return EMOTION_COLORS.neutral
}

function SceneCard({
  scene,
  index,
  isEditing,
  onEdit,
  onSaveEdit,
  editText,
  onEditTextChange,
}: {
  scene: StoryboardScene
  index: number
  isEditing: boolean
  onEdit: () => void
  onSaveEdit: () => void
  editText: string
  onEditTextChange: (text: string) => void
}) {
  return (
    <div className="bg-[#1a1a1a] border border-panel-surface rounded-lg overflow-hidden hover:border-panel-border transition-colors group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-900 flex items-center justify-center">
        {scene.thumbnailSvg ? (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: sanitizeSvg(scene.thumbnailSvg) }}
          />
        ) : (
          <div className="text-zinc-600 text-xs">Scene {index + 1}</div>
        )}

        {/* Duration badge */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/60 rounded px-1 py-0.5">
          <Clock size={8} className="text-zinc-400" />
          <span className="text-[8px] text-zinc-300">{scene.durationSeconds}s</span>
        </div>

        {/* Scene number */}
        <div className="absolute top-1 left-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center">
          <span className="text-[9px] text-white font-bold">{index + 1}</span>
        </div>

      </div>

      {/* Scene info */}
      <div className="p-2 space-y-1.5">
        {/* Character + Emotion */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-medium text-zinc-300 truncate">
            {scene.characterName}
          </span>
          <span
            className={cn(
              'text-[8px] px-1.5 py-0.5 rounded-full border',
              getEmotionClass(scene.emotion),
            )}
          >
            {scene.emotion}
          </span>
        </div>

        {/* Dialogue text */}
        <div className="relative">
          {isEditing ? (
            <div className="space-y-1">
              <textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded text-[10px] text-zinc-200 p-1 min-h-[40px] resize-none focus:border-amber-500/50 focus:outline-none"
                rows={2}
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={onEdit}
                  className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400"
                >
                  <X size={10} />
                </button>
                <button
                  onClick={onSaveEdit}
                  className="p-0.5 rounded hover:bg-emerald-700/30 text-emerald-400"
                >
                  <Check size={10} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              <MessageSquare size={10} className="text-zinc-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed flex-1">
                {scene.dialogueText}
              </p>
              <button
                onClick={onEdit}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-500 transition-opacity shrink-0"
              >
                <Pencil size={8} />
              </button>
            </div>
          )}
        </div>

        {/* Visual description */}
        <div className="flex items-center gap-1">
          <Smile size={8} className="text-zinc-600 shrink-0" />
          <p className="text-[9px] text-zinc-500 truncate">{scene.visualDescription}</p>
        </div>
      </div>
    </div>
  )
}

export function StoryboardPhase({ onExecute, onBack }: StoryboardPhaseProps) {
  const plan = useOrchestratorStore((s) => s.plan)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const scenes = useMemo(() => {
    if (!plan) return []
    return generateStoryboardFromPlan(plan)
  }, [plan])

  const totalDuration = useMemo(
    () => scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
    [scenes],
  )

  const handleEdit = useCallback((index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null)
      return
    }
    setEditingIndex(index)
    setEditText(scenes[index]?.dialogueText || '')
  }, [editingIndex, scenes])

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null || !plan) return

    // Update the dialogue in the plan
    const updatedDialogue = [...plan.dialogue]
    const line = updatedDialogue[editingIndex]
    if (line) {
      // Preserve emotion cues, replace just the text
      const emotionMatch = line.script.match(/\[([^\]]+)\]/)
      const emotionPrefix = emotionMatch ? `[${emotionMatch[1]}] ` : ''
      updatedDialogue[editingIndex] = {
        ...line,
        script: emotionPrefix + editText,
      }
      useOrchestratorStore.setState({
        plan: { ...plan, dialogue: updatedDialogue },
      })
    }
    setEditingIndex(null)
  }, [editingIndex, editText, plan])

  if (!plan || scenes.length === 0) return null

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Storyboard Preview</h3>
          <p className="text-[10px] text-zinc-500">
            {scenes.length} scenes · {totalDuration.toFixed(1)}s total
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700 transition-colors"
          >
            Back to Plan
          </button>
          <button
            onClick={onExecute}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
          >
            <Play size={10} />
            Execute
          </button>
        </div>
      </div>

      {/* Scene Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {scenes.map((scene, i) => (
          <SceneCard
            key={i}
            scene={scene}
            index={i}
            isEditing={editingIndex === i}
            onEdit={() => handleEdit(i)}
            onSaveEdit={handleSaveEdit}
            editText={editText}
            onEditTextChange={setEditText}
          />
        ))}
      </div>

      {/* Timeline overview bar */}
      <div className="bg-[#1a1a1a] rounded-lg p-2 border border-panel-surface">
        <div className="flex gap-0.5 h-3 rounded overflow-hidden">
          {scenes.map((scene, i) => {
            const widthPercent = (scene.durationSeconds / totalDuration) * 100
            return (
              <div
                key={i}
                className={cn(
                  'rounded-sm transition-all hover:opacity-80',
                  getEmotionClass(scene.emotion).split(' ')[0],
                )}
                style={{ width: `${widthPercent}%`, minWidth: '8px' }}
                title={`Scene ${i + 1}: ${scene.characterName} — ${scene.emotion}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-zinc-600">0s</span>
          <span className="text-[8px] text-zinc-600">{totalDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  )
}
