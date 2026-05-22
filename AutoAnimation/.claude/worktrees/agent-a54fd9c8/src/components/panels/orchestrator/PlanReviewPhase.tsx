import { useState, useCallback } from 'react'
import {
  Sparkles,
  Film,
  Palette,
  Users,
  MessageSquare,
  Type,
  Code2,
  Shapes,
  Music,
  RefreshCw,
  Play,
  Pencil,
  Check,
  Plus,
  Trash2,
  Zap,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider } from '@/components/ui/panel-controls'
import { PlanSectionCard } from './PlanSectionCard'
import { CostBreakdown } from './CostBreakdown'
import type {
  ClipPlan,
  OrchestrationCost,
  ClipPlanTextOverlay,
} from '@/types/orchestrator'
import type { SavedCharacter } from '@/stores/useSavedCharactersStore'
import type { Saved3DCharacter } from '@/types/character3d'
import type { ElevenLabsVoice } from '@/types/voice'

// ── Shared UI helpers ──

const selectClass =
  'bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500/60'
const inputClass = selectClass
const btnSave =
  'flex items-center gap-1 px-2 py-1 rounded text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 transition-colors'
// ── Types ──

type EditingSection =
  | { type: 'character'; index: number }
  | { type: 'dialogue'; index: number }
  | { type: 'textOverlay'; index: number }
  | { type: 'background' }
  | null

interface PlanReviewPhaseProps {
  plan: ClipPlan
  cost: OrchestrationCost
  isRunning: boolean
  savedCharacters: SavedCharacter[]
  saved3DCharacters: Saved3DCharacter[]
  availableVoices: ElevenLabsVoice[]
  onRegenerate: () => void
  onExecute: (modifiedPlan?: ClipPlan) => void
  onGenerateVariants?: () => void
  isGeneratingVariations?: boolean
  onReset: () => void
}

export function PlanReviewPhase({
  plan: originalPlan,
  cost,
  isRunning,
  savedCharacters,
  saved3DCharacters,
  availableVoices,
  onRegenerate,
  onExecute,
  onGenerateVariants,
  isGeneratingVariations,
  onReset,
}: PlanReviewPhaseProps) {
  const [editedPlan, setEditedPlan] = useState<ClipPlan | null>(null)
  const [editing, setEditing] = useState<EditingSection>(null)

  const plan = editedPlan ?? originalPlan

  // ── Plan mutation helper ──
  const mutatePlan = useCallback(
    (updater: (draft: ClipPlan) => void) => {
      setEditedPlan((prev) => {
        const clone = prev ? structuredClone(prev) : structuredClone(originalPlan)
        updater(clone)
        return clone
      })
    },
    [originalPlan],
  )

  const startEditing = useCallback((section: EditingSection) => {
    setEditing(section)
  }, [])

  const stopEditing = useCallback(() => {
    setEditing(null)
  }, [])

  // ── Character names from plan (for dialogue assignment) ──
  const characterNames = plan.characters.map((c) => c.name)

  // ── Execute handler ──
  const handleExecute = useCallback(() => {
    if (editedPlan) {
      onExecute(structuredClone(editedPlan))
    } else {
      onExecute()
    }
  }, [editedPlan, onExecute])

  const hasEdits = editedPlan !== null

  // ── Aspect ratio options ──
  const aspectRatios: ClipPlan['canvas']['aspectRatio'][] = ['16:9', '9:16', '1:1', '4:3', '21:9']

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={14} className="text-amber-400" />
        <h4 className="text-xs font-medium text-amber-300">Clip Plan</h4>
        {hasEdits && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30">
            edited
          </span>
        )}
      </div>

      {/* ══ Canvas (inline editable) ══ */}
      <PlanSectionCard icon={Film} title="Canvas" defaultExpanded>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
            Aspect:
            <select
              value={plan.canvas.aspectRatio}
              onChange={(e) =>
                mutatePlan((d) => {
                  d.canvas.aspectRatio = e.target.value as ClipPlan['canvas']['aspectRatio']
                })
              }
              className={selectClass}
            >
              {aspectRatios.map((ar) => (
                <option key={ar} value={ar}>
                  {ar}
                </option>
              ))}
            </select>
          </label>
          <PanelSlider
            label="FPS"
            value={plan.canvas.fps}
            onChange={(v) =>
              mutatePlan((d) => {
                d.canvas.fps = Math.max(1, v)
              })
            }
            min={1}
            max={120}
            step={1}
            inline
          />
          <PanelSlider
            label="Duration"
            value={plan.canvas.durationSeconds}
            onChange={(v) =>
              mutatePlan((d) => {
                d.canvas.durationSeconds = Math.max(1, v)
              })
            }
            min={1}
            max={600}
            step={1}
            suffix="s"
            inline
          />
        </div>
      </PlanSectionCard>

      {/* ══ Background (expandable edit) ══ */}
      <PlanSectionCard icon={Palette} title="Background">
        {editing?.type === 'background' ? (
          <div className="space-y-1.5">
            {plan.background.type === 'lottie' ? (
              <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                Lottie query:
                <input
                  type="text"
                  value={plan.background.lottieQuery || ''}
                  onChange={(e) =>
                    mutatePlan((d) => {
                      d.background.lottieQuery = e.target.value
                    })
                  }
                  className={cn(inputClass, 'flex-1')}
                  autoFocus
                />
              </label>
            ) : (
              <label className="block text-[11px] text-gray-400 space-y-1">
                SVG prompt:
                <textarea
                  value={plan.background.svgPrompt || ''}
                  onChange={(e) =>
                    mutatePlan((d) => {
                      d.background.svgPrompt = e.target.value
                    })
                  }
                  className={cn(inputClass, 'w-full resize-none min-h-[3rem]')}
                  autoFocus
                />
              </label>
            )}
            <div className="flex justify-end">
              <button onClick={stopEditing} className={btnSave}>
                <Check size={10} />
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="group flex items-start gap-1.5">
            <p className="text-[11px] text-gray-400 flex-1">
              {plan.background.type === 'lottie'
                ? `Lottie: ${plan.background.lottieQuery || 'auto-select'}`
                : `Custom SVG: ${plan.background.svgPrompt?.slice(0, 60) || ''}...`}
            </p>
            <button
              onClick={() => startEditing({ type: 'background' })}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#3a3a3a]/50 text-gray-500 hover:text-gray-300 transition-all shrink-0"
              title="Edit background"
            >
              <Pencil size={10} />
            </button>
          </div>
        )}
      </PlanSectionCard>

      {/* ══ Characters (editable) ══ */}
      {plan.characters.length > 0 && (
        <PlanSectionCard icon={Users} title="Characters" count={plan.characters.length}>
          {plan.characters.map((c, i) => {
            const isEditing = editing?.type === 'character' && editing.index === i
            const is3D = c.dimension === '3d'
            const charList = is3D ? saved3DCharacters : savedCharacters

            if (isEditing) {
              return (
                <div key={i} className="bg-[#2a2a2a]/60 rounded-md p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-300">{c.name}</span>
                  </div>

                  {/* Saved character dropdown */}
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    Character:
                    <select
                      value={c.generateNew ? '__generate__' : c.savedCharacterName || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        mutatePlan((d) => {
                          if (val === '__generate__') {
                            d.characters[i].generateNew = true
                            d.characters[i].savedCharacterName = undefined
                          } else {
                            d.characters[i].generateNew = false
                            d.characters[i].savedCharacterName = val || undefined
                          }
                        })
                      }}
                      className={cn(selectClass, 'flex-1')}
                    >
                      <option value="">-- None --</option>
                      <option value="__generate__">Generate New</option>
                      {charList.map((sc) => (
                        <option key={sc.id} value={sc.name}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Voice dropdown */}
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    Voice:
                    <select
                      value={c.voiceName || ''}
                      onChange={(e) =>
                        mutatePlan((d) => {
                          d.characters[i].voiceName = e.target.value || undefined
                        })
                      }
                      className={cn(selectClass, 'flex-1')}
                    >
                      <option value="">-- Auto --</option>
                      {availableVoices.map((v) => (
                        <option key={v.voice_id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center gap-1.5 justify-end">
                    {/* Remove character */}
                    <button
                      onClick={() => {
                        const charName = plan.characters[i].name
                        mutatePlan((d) => {
                          d.characters.splice(i, 1)
                          d.dialogue = d.dialogue.filter((dl) => dl.characterName !== charName)
                        })
                        stopEditing()
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors mr-auto"
                    >
                      <Trash2 size={10} />
                      Remove
                    </button>
                    <button onClick={stopEditing} className={btnSave}>
                      <Check size={10} />
                      Done
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className="group flex items-center gap-1.5 text-[11px] text-gray-400 hover:bg-[#2a2a2a]/30 px-1 py-0.5 rounded-md transition-colors">
                <span className="text-gray-300">{c.name}</span>
                {c.savedCharacterName && (
                  <span className="text-emerald-400">({c.savedCharacterName})</span>
                )}
                {c.generateNew && (
                  <span className="text-amber-400">(will generate)</span>
                )}
                {c.voiceName && (
                  <span className="text-violet-400">voice: {c.voiceName}</span>
                )}
                <button
                  onClick={() => startEditing({ type: 'character', index: i })}
                  className="opacity-0 group-hover:opacity-100 ml-auto p-1 rounded hover:bg-[#3a3a3a]/50 text-gray-500 hover:text-gray-300 transition-all shrink-0"
                  title="Edit character"
                >
                  <Pencil size={10} />
                </button>
              </div>
            )
          })}
        </PlanSectionCard>
      )}

      {/* ══ Dialogue (editable — script, emotion, character assignment, add/remove) ══ */}
      {plan.dialogue.length > 0 && (
        <PlanSectionCard
          icon={MessageSquare}
          title={`Dialogue (${plan.dialogue.length} lines)`}
          count={plan.dialogue.length}
          defaultExpanded
        >
          <div className="space-y-1.5">
            {plan.dialogue.map((d, i) => {
              const isEditing = editing?.type === 'dialogue' && editing.index === i

              if (isEditing) {
                return (
                  <div key={i} className="bg-[#2a2a2a]/60 rounded-md p-2 space-y-1.5">
                    {/* Character + Emotion row */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={d.characterName}
                        onChange={(e) =>
                          mutatePlan((draft) => {
                            draft.dialogue[i].characterName = e.target.value
                          })
                        }
                        className={cn(selectClass, 'max-w-[120px]')}
                      >
                        {characterNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={d.emotion || ''}
                        onChange={(e) =>
                          mutatePlan((draft) => {
                            draft.dialogue[i].emotion = e.target.value || undefined
                          })
                        }
                        placeholder="emotion"
                        className={cn(inputClass, 'w-24')}
                      />
                    </div>

                    {/* Script textarea */}
                    <textarea
                      value={d.script}
                      onChange={(e) =>
                        mutatePlan((draft) => {
                          draft.dialogue[i].script = e.target.value
                        })
                      }
                      className={cn(inputClass, 'w-full resize-none min-h-[3rem]')}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') stopEditing()
                      }}
                    />

                    <div className="flex items-center gap-1.5 justify-end">
                      {/* Remove line */}
                      <button
                        onClick={() => {
                          mutatePlan((draft) => {
                            draft.dialogue.splice(i, 1)
                          })
                          stopEditing()
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors mr-auto"
                      >
                        <Trash2 size={10} />
                        Remove
                      </button>
                      <button onClick={stopEditing} className={btnSave}>
                        <Check size={10} />
                        Done
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={i}
                  className="group hover:bg-[#2a2a2a]/30 px-1 py-0.5 rounded-md transition-colors"
                >
                  <div className="flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-gray-300">
                          {d.characterName}:
                        </span>
                        {d.emotion && (
                          <span className="text-[9px] px-1 py-0.5 rounded-full bg-violet-900/20 text-violet-400/70">
                            {d.emotion}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {d.script.slice(0, 80)}
                        {d.script.length > 80 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => startEditing({ type: 'dialogue', index: i })}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#3a3a3a]/50 text-gray-500 hover:text-gray-300 transition-all shrink-0 mt-0.5"
                      title="Edit dialogue"
                    >
                      <Pencil size={10} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Add dialogue line */}
            <button
              onClick={() => {
                mutatePlan((draft) => {
                  draft.dialogue.push({
                    characterName: characterNames[0] || 'Character',
                    script: '',
                    emotion: undefined,
                  })
                })
                startEditing({ type: 'dialogue', index: plan.dialogue.length })
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-500 hover:text-gray-300 hover:bg-[#3a3a3a]/30 transition-colors w-full justify-center"
            >
              <Plus size={10} />
              Add Line
            </button>
          </div>
        </PlanSectionCard>
      )}

      {/* ══ Text Overlays (editable) ══ */}
      {plan.textOverlays.length > 0 && (
        <PlanSectionCard icon={Type} title="Text Overlays" count={plan.textOverlays.length}>
          {plan.textOverlays.map((t, i) => {
            const isEditing = editing?.type === 'textOverlay' && editing.index === i
            const presets: ClipPlanTextOverlay['preset'][] = [
              'title',
              'subtitle',
              'lower-third',
              'cta',
              'quote',
              'watermark',
            ]

            if (isEditing) {
              return (
                <div key={i} className="bg-[#2a2a2a]/60 rounded-md p-2 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    Preset:
                    <select
                      value={t.preset}
                      onChange={(e) =>
                        mutatePlan((draft) => {
                          draft.textOverlays[i].preset = e.target.value as ClipPlanTextOverlay['preset']
                        })
                      }
                      className={selectClass}
                    >
                      {presets.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    value={t.content}
                    onChange={(e) =>
                      mutatePlan((draft) => {
                        draft.textOverlays[i].content = e.target.value
                      })
                    }
                    className={cn(inputClass, 'w-full resize-none min-h-[2.5rem]')}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') stopEditing()
                    }}
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => {
                        mutatePlan((draft) => {
                          draft.textOverlays.splice(i, 1)
                        })
                        stopEditing()
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors mr-auto"
                    >
                      <Trash2 size={10} />
                      Remove
                    </button>
                    <button onClick={stopEditing} className={btnSave}>
                      <Check size={10} />
                      Done
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className="group flex items-center gap-1.5 text-[11px] text-gray-400 hover:bg-[#2a2a2a]/30 px-1 py-0.5 rounded-md transition-colors">
                <span className="text-gray-500">[{t.preset}]</span>{' '}
                <span className="flex-1 truncate">
                  {t.content.slice(0, 40)}
                  {t.content.length > 40 ? '...' : ''}
                </span>
                <button
                  onClick={() => startEditing({ type: 'textOverlay', index: i })}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#3a3a3a]/50 text-gray-500 hover:text-gray-300 transition-all shrink-0"
                  title="Edit text overlay"
                >
                  <Pencil size={10} />
                </button>
              </div>
            )
          })}
        </PlanSectionCard>
      )}

      {/* HTML Templates (read-only) */}
      {plan.htmlTemplates && plan.htmlTemplates.length > 0 && (
        <PlanSectionCard
          icon={Code2}
          title="HTML Templates"
          count={plan.htmlTemplates.length}
        >
          {plan.htmlTemplates.map((t, i) => (
            <div key={i} className="text-[11px] text-gray-400">
              <span className="text-cyan-400">{t.templateId}</span>
              {t.query && <span className="text-gray-500 ml-1">({t.query})</span>}
              <span className="text-gray-600 ml-1">
                {Math.round((t.startPercent ?? 0) * 100)}%–
                {Math.round((t.endPercent ?? 1) * 100)}%
              </span>
            </div>
          ))}
        </PlanSectionCard>
      )}

      {/* SVG Objects (read-only) */}
      {plan.svgObjects && plan.svgObjects.length > 0 && (
        <PlanSectionCard icon={Shapes} title="SVG Objects" count={plan.svgObjects.length}>
          {plan.svgObjects.map((o, i) => (
            <div key={i} className="text-[11px] text-gray-400">
              <span className="text-orange-400">{o.prompt}</span>
              <span className="text-gray-600 ml-1">
                {Math.round((o.startPercent ?? 0) * 100)}%–
                {Math.round((o.endPercent ?? 1) * 100)}%
              </span>
              {o.keyframes && o.keyframes.length > 0 && (
                <span className="text-gray-600 ml-1">({o.keyframes.length} keyframes)</span>
              )}
            </div>
          ))}
        </PlanSectionCard>
      )}

      {/* ══ Captions (inline dropdowns) ══ */}
      <PlanSectionCard icon={Music} title="Captions">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
            Style:
            <select
              value={plan.captions.style}
              onChange={(e) =>
                mutatePlan((d) => {
                  d.captions.style = e.target.value as ClipPlan['captions']['style']
                })
              }
              className={selectClass}
            >
              <option value="word-by-word">word-by-word</option>
              <option value="sentence">sentence</option>
              <option value="karaoke">karaoke</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
            Position:
            <select
              value={plan.captions.position}
              onChange={(e) =>
                mutatePlan((d) => {
                  d.captions.position = e.target.value as ClipPlan['captions']['position']
                })
              }
              className={selectClass}
            >
              <option value="top">top</option>
              <option value="center">center</option>
              <option value="bottom">bottom</option>
            </select>
          </label>
        </div>
      </PlanSectionCard>

      {/* Token Cost */}
      {cost.entries.length > 0 && <CostBreakdown cost={cost} />}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onRegenerate}
          disabled={isRunning || isGeneratingVariations}
          className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-[#3a3a3a] hover:bg-[#3a3a3a] text-gray-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw size={14} />
          Regenerate
        </button>
        <button
          onClick={handleExecute}
          disabled={isRunning || isGeneratingVariations}
          className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-600/10 hover:shadow-amber-500/20"
        >
          <Play size={14} />
          Execute Plan
        </button>
      </div>

      {/* Generate Variants */}
      {onGenerateVariants && <button
        onClick={onGenerateVariants}
        disabled={isRunning || isGeneratingVariations}
        className="w-full py-2.5 rounded-lg text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
      >
        {isGeneratingVariations ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating Variants...
          </>
        ) : (
          <>
            <Zap size={14} />
            Generate & Compare Variants
          </>
        )}
      </button>}

      <button
        onClick={onReset}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Start Over
      </button>
    </div>
  )
}
