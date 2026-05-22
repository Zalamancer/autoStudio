import { cn } from '@/lib/utils'
import { useVoiceStore } from '@/stores'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import type { CaptionStyle } from '@/types/voice'

const PRESET_COLORS = [
  '#ffffff', '#facc15', '#4ade80', '#22d3ee',
  '#f472b6', '#fb923c', '#a78bfa', '#f87171',
]

export function CaptionsPanel() {
  const {
    captionStyle,
    captionFontSize,
    captionPosition,
    captionColor,
    captionBgOpacity,
    setCaptionStyle,
    setCaptionFontSize,
    setCaptionPosition,
    setCaptionColor,
    setCaptionBgOpacity,
  } = useVoiceStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Caption Style ── */}
        <div className="space-y-3 pb-3 border-b border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Display</span>
          <div className="grid grid-cols-3 gap-1">
            {(['word-by-word', 'sentence', 'karaoke'] as CaptionStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setCaptionStyle(style)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-medium transition-colors border',
                  captionStyle === style
                    ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30 text-[#4a7eff]'
                    : 'bg-[#2a2a2a] border-white/5 text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                )}
              >
                {style === 'word-by-word' ? 'Word' : style === 'sentence' ? 'Sentence' : 'Karaoke'}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">
            {captionStyle === 'word-by-word' && 'Shows one word at a time as it is spoken.'}
            {captionStyle === 'sentence' && 'Shows full sentences while being spoken.'}
            {captionStyle === 'karaoke' && 'Shows sentence with highlighted active word.'}
          </p>
        </div>

        {/* ── Position ── */}
        <div className="space-y-3 py-3 border-b border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Position</span>
          <div className="grid grid-cols-3 gap-1">
            {(['top', 'center', 'bottom'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setCaptionPosition(pos)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-medium transition-colors capitalize border',
                  captionPosition === pos
                    ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30 text-[#4a7eff]'
                    : 'bg-[#2a2a2a] border-white/5 text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                )}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* ── Size & Opacity ── */}
        <div className="space-y-3 py-3 border-b border-white/5">
          <PanelSlider
            label="Size"
            value={captionFontSize}
            onChange={(v) => setCaptionFontSize(Math.round(v))}
            min={12} max={120} step={1}
            suffix="px"
            compact
          />
          <PanelSlider
            label="BG Opacity"
            value={Math.round(captionBgOpacity * 100)}
            onChange={(v) => setCaptionBgOpacity(Math.min(1, Math.max(0, v / 100)))}
            min={0} max={100} step={5}
            suffix="%"
            compact
          />
        </div>

        {/* ── Color ── */}
        <div className="space-y-3 py-3 border-b border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Color</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setCaptionColor(c)}
                className={cn(
                  'w-6 h-6 rounded-md border-2 transition-all',
                  captionColor === c
                    ? 'border-[#4a7eff] scale-110'
                    : 'border-transparent hover:border-white/30'
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <ColorPicker color={captionColor} onChange={(c) => setCaptionColor(c)} />
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="space-y-3 py-3">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Preview</span>
          <div className="relative bg-[#1e1e1e] rounded-lg overflow-hidden h-32 flex items-center justify-center border border-white/5">
            <div
              className={cn(
                'absolute left-0 right-0 flex justify-center px-4',
                captionPosition === 'top' && 'top-3',
                captionPosition === 'center' && 'top-1/2 -translate-y-1/2',
                captionPosition === 'bottom' && 'bottom-3'
              )}
            >
              <div
                className="px-4 py-2 rounded-xl backdrop-blur-sm"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${captionBgOpacity})`,
                  fontSize: Math.min(captionFontSize, 24),
                }}
              >
                {captionStyle === 'karaoke' ? (
                  <span>
                    <span style={{ color: captionColor }} className="font-bold opacity-60">
                      Hello{' '}
                    </span>
                    <span style={{ color: '#4ade80' }} className="font-bold">
                      world{' '}
                    </span>
                    <span style={{ color: captionColor }} className="font-bold opacity-60">
                      how are you
                    </span>
                  </span>
                ) : (
                  <span className="font-bold" style={{ color: captionColor }}>
                    {captionStyle === 'word-by-word' ? 'Hello' : 'Hello world, how are you?'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
