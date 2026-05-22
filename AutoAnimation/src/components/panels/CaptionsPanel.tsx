import { cn } from '@/lib/utils'
import { useVoiceStore } from '@/stores'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import type { CaptionStyle } from '@/types/voice'

const PRESET_COLORS = [
  '#ffffff', '#facc15', '#4ade80', '#22d3ee',
  '#f472b6', '#fb923c', '#a78bfa', '#f87171',
]

const STYLE_OPTIONS: { id: CaptionStyle; label: string; hint: string }[] = [
  { id: 'word-by-word', label: 'Word', hint: 'Shows one word at a time as it is spoken.' },
  { id: 'sentence', label: 'Sentence', hint: 'Shows full sentences while being spoken.' },
  { id: 'karaoke', label: 'Karaoke', hint: 'Shows sentence with highlighted active word.' },
  { id: 'phrase', label: 'TikTok', hint: 'Big 2-3 word chunks, active word highlighted. (Hormozi/MrBeast style)' },
]

export function CaptionsPanel() {
  const {
    captionStyle,
    captionFontSize,
    captionPosition,
    captionColor,
    captionBgOpacity,
    captionPhraseSize,
    setCaptionStyle,
    setCaptionFontSize,
    setCaptionPosition,
    setCaptionColor,
    setCaptionBgOpacity,
    setCaptionPhraseSize,
  } = useVoiceStore()

  const isPhrase = captionStyle === 'phrase'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Caption Style ── */}
        <div className="space-y-3 pb-3 border-b border-white/5">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Display</span>
          <div className="grid grid-cols-4 gap-1">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setCaptionStyle(opt.id)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-medium transition-colors border',
                  captionStyle === opt.id
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-panel-surface border-white/5 text-gray-400 hover:bg-panel-surface-hover hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">
            {STYLE_OPTIONS.find((o) => o.id === captionStyle)?.hint}
          </p>
        </div>

        {/* ── Phrase Size (only when phrase selected) ── */}
        {isPhrase && (
          <div className="space-y-3 py-3 border-b border-white/5">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Words per chunk</span>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCaptionPhraseSize(n)}
                  className={cn(
                    'py-2 rounded-lg text-[11px] font-medium transition-colors border',
                    captionPhraseSize === n
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-panel-surface border-white/5 text-gray-400 hover:bg-panel-surface-hover hover:text-white'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

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
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-panel-surface border-white/5 text-gray-400 hover:bg-panel-surface-hover hover:text-white'
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
            min={12} max={160} step={1}
            suffix="px"
            compact
          />
          {!isPhrase && (
            <PanelSlider
              label="BG Opacity"
              value={Math.round(captionBgOpacity * 100)}
              onChange={(v) => setCaptionBgOpacity(Math.min(1, Math.max(0, v / 100)))}
              min={0} max={100} step={5}
              suffix="%"
              compact
            />
          )}
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
                    ? 'border-accent scale-110'
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
          <div className="relative bg-panel-bg rounded-lg overflow-hidden h-32 flex items-center justify-center border border-white/5">
            <div
              className={cn(
                'absolute left-0 right-0 flex justify-center px-4',
                captionPosition === 'top' && 'top-3',
                captionPosition === 'center' && 'top-1/2 -translate-y-1/2',
                captionPosition === 'bottom' && 'bottom-3'
              )}
            >
              {captionStyle === 'phrase' ? (
                <div className="flex gap-2 items-center">
                  {['HELLO', 'WORLD', 'NOW'].slice(0, captionPhraseSize ?? 3).map((w, i) => (
                    <span
                      key={i}
                      className="font-black uppercase"
                      style={{
                        fontSize: Math.min(captionFontSize, 28),
                        color: i === 1 ? '#facc15' : captionColor,
                        WebkitTextStroke: '2px #000',
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        paintOrder: 'stroke fill' as const,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
