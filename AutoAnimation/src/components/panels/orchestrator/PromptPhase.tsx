import { useCallback, useRef, useEffect } from 'react'
import { Link2, Paperclip, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRESETS } from './constants'
import { SettingsSection } from './SettingsSection'
import type { OrchestratorSettings } from '@/types/orchestrator'
import { useEditorStore } from '@/stores'

interface PromptPhaseProps {
  prompt: string
  isRunning: boolean
  settings: OrchestratorSettings
  savedCharacters: Array<{
    id: string
    name: string
    referenceImage?: string | null
  }>
  saved3DCharacters: Array<{
    id: string
    name: string
    thumbnailDataUrl?: string
  }>
  setPrompt: (prompt: string) => void
  updateSettings: (updates: Partial<OrchestratorSettings>) => void
  onGeneratePlan: () => void
  // Library data
  marketplaceItems: Array<{ id: string; title: string; category: string }>
  animationLibrary: Array<{ id: string; name: string }>
  audioAssets: Array<{ id: string; name: string }>
}

export function PromptPhase({
  prompt,
  isRunning,
  settings,
  savedCharacters,
  saved3DCharacters,
  setPrompt,
  updateSettings,
  onGeneratePlan,
  marketplaceItems,
  animationLibrary,
  audioAssets,
}: PromptPhaseProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [prompt, autoResize])

  return (
    <div className="flex gap-4 animate-fade-in-up h-full">
      {/* ══ LEFT: Prompt + tools ══ */}
      <div className="flex-1 min-w-0 space-y-3 overflow-y-auto pr-1">
        {/* ── Preset Pills ── */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setPrompt(preset.prompt)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#2a2a2a] border border-white/5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] hover:border-white/10 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* ── Prompt Input + Toolbar ── */}
        <div className="relative group">
          <div
            className={cn(
              'absolute -inset-px rounded-lg transition-opacity duration-300 pointer-events-none',
              'bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-amber-500/20',
              'opacity-0 group-focus-within:opacity-100',
            )}
          />
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onInput={autoResize}
              placeholder="Create a 30-second explainer video about space exploration with two characters..."
              className="w-full min-h-[10rem] bg-panel-bg border border-panel-border rounded-t-lg px-3 py-2.5 pr-12 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/60 transition-colors"
              disabled={isRunning}
            />
            {/* Character count */}
            <span className="absolute bottom-2 right-2 text-[10px] text-gray-600">{prompt.length}</span>
          </div>

          {/* ── Toolbar ── */}
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

      {/* ══ RIGHT: Settings ══ */}
      <div className="w-[320px] shrink-0 overflow-y-auto border-l border-white/5 pl-4">
        <SettingsSection
          settings={settings}
          updateSettings={updateSettings}
          savedCharacters={savedCharacters}
          saved3DCharacters={saved3DCharacters}
          marketplaceItems={marketplaceItems}
          animationLibrary={animationLibrary}
          audioAssets={audioAssets}
        />
      </div>
    </div>
  )
}
