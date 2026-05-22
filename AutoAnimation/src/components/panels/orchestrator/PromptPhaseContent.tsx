/**
 * Prompt Phase — Left Panel Content (prompt + tools only, no settings)
 *
 * Settings live in the right panel (AIDirectorSettingsPanel).
 * URL, Document, and Brand tools open in the right panel.
 */

import { useCallback, useRef, useEffect } from 'react'
import { Link2, Paperclip, Building2, BookImage } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRESETS } from './constants'
import { useEditorStore } from '@/stores'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'

interface PromptPhaseContentProps {
  prompt: string
  isRunning: boolean
  setPrompt: (prompt: string) => void
  onGeneratePlan: () => void
  marketplaceItems: Array<{ id: string; title: string; category: string }>
  animationLibrary: Array<{ id: string; name: string }>
  audioAssets: Array<{ id: string; name: string }>
}

export function PromptPhaseContent({ prompt, isRunning, setPrompt }: PromptPhaseContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const imageStoryMode = useOrchestratorStore((s) => s.settings.imageStoryMode)
  const updateSettings = useOrchestratorStore((s) => s.updateSettings)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [prompt, autoResize])

  const toggleImageStory = () => {
    const next = !imageStoryMode
    updateSettings({ imageStoryMode: next })
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Mode + Preset Pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={toggleImageStory}
          className={cn(
            'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1',
            imageStoryMode
              ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
              : 'bg-[#2a2a2a] border-white/5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] hover:border-white/10',
          )}
        >
          <BookImage size={11} />
          Image Story
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              if (imageStoryMode) updateSettings({ imageStoryMode: false })
              setPrompt(preset.prompt)
            }}
            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#2a2a2a] border border-white/5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] hover:border-white/10 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Prompt Input + Toolbar */}
      <div className="relative group">
        <div
          className={cn(
            'absolute -inset-px rounded-lg transition-opacity duration-300 pointer-events-none',
            imageStoryMode
              ? 'bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-blue-500/20'
              : 'bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-amber-500/20',
            'opacity-0 group-focus-within:opacity-100',
          )}
        />
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onInput={autoResize}
            placeholder={
              imageStoryMode
                ? 'Describe your story... e.g. "A dog runs across the park and catches a frisbee"'
                : 'Create a 30-second explainer video about space exploration with two characters...'
            }
            className="w-full min-h-[10rem] bg-panel-bg border border-panel-border rounded-t-lg px-3 py-2.5 pr-12 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/60 transition-colors"
            disabled={isRunning}
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-gray-600">{prompt.length}</span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-panel-bg border border-t-0 border-panel-border rounded-b-lg">
          <button
            onClick={() =>
              setRightPanelTab(rightPanelTab === 'ai-director-url' ? 'ai-director-settings' : 'ai-director-url')
            }
            title="Paste URL"
            className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
              rightPanelTab === 'ai-director-url'
                ? 'bg-green-500/15 text-green-400'
                : 'text-gray-500 hover:text-white hover:bg-[#2a2a2a]',
            )}
          >
            <Link2 size={14} />
          </button>
          <button
            onClick={() =>
              setRightPanelTab(
                rightPanelTab === 'ai-director-document' ? 'ai-director-settings' : 'ai-director-document',
              )
            }
            title="Upload PDF"
            disabled={isRunning}
            className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-40',
              rightPanelTab === 'ai-director-document'
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-gray-500 hover:text-white hover:bg-[#2a2a2a]',
            )}
          >
            <Paperclip size={14} />
          </button>
          <button
            onClick={() =>
              setRightPanelTab(rightPanelTab === 'ai-director-brand' ? 'ai-director-settings' : 'ai-director-brand')
            }
            title="Brand Director"
            className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
              rightPanelTab === 'ai-director-brand'
                ? 'bg-violet-500/15 text-violet-400'
                : 'text-gray-500 hover:text-white hover:bg-[#2a2a2a]',
            )}
          >
            <Building2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
