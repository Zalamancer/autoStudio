/**
 * Whiteboard Panel
 *
 * Controls for whiteboard drawing animation mode including
 * enable/disable, pen settings, background style, hand overlay,
 * drawing mode, animation speed, and stroke management.
 */

import { useState } from 'react'
import {
  PenTool,
  Palette,
  Zap,
} from 'lucide-react'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSlider, PanelToggle } from '@/components/ui/panel-controls'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { useEditorStore } from '@/stores'

// ── Section Component ──────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  trailing,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider flex items-center gap-2 uppercase">
          <Icon size={14} className="text-zinc-500" />
          {title}
        </h4>
        {trailing}
      </div>
      <div className="space-y-3 p-3 bg-zinc-800/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner">
        {children}
      </div>
    </div>
  )
}


/** Background preset labels for display */
const BG_STYLE_LABELS: Record<string, string> = {
  white: 'White',
  'light-gray': 'Light Gray',
  dark: 'Dark',
  cream: 'Cream',
  chalkboard: 'Chalkboard',
  blueprint: 'Blueprint',
  'cutting-mat': 'Cutting Mat',
  drafting: 'Drafting',
  custom: 'Custom',
}



// ── Main Component ─────────────────────────────────────────────────────

export function WhiteboardPanel() {
  const enabled = useWhiteboardStore((s) => s.enabled)
  const config = useWhiteboardStore((s) => s.config)
  const setEnabled = useWhiteboardStore((s) => s.setEnabled)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const [animSpeed, setAnimSpeed] = useState(30)


  return (
    <PanelLayout icon={PenTool} title="Whiteboard" iconClassName="text-green-400">
      {/* ── Enable Toggle ──────────────────────────────────────── */}
      <PanelToggle label="Whiteboard Mode" checked={enabled} onChange={setEnabled} />

      {/* ── Background ─────────────────────────────────────────── */}
      <Section icon={Palette} title="Background">
        <button
          onClick={() => setRightPanelTab('whiteboard-background-properties')}
          className="w-full group"
        >
          <div
            className="w-full aspect-video rounded-lg border border-zinc-600 relative overflow-hidden group-hover:border-green-500/40 transition-colors"
            style={{
              backgroundColor: config.backgroundType === 'preset' ? config.backgroundColor : undefined,
              backgroundImage: config.backgroundType === 'image' && config.backgroundImageUrl
                ? `url(${config.backgroundImageUrl})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Preset style indicators */}
            {config.backgroundType === 'preset' && config.backgroundStyle === 'cutting-mat' && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 27" preserveAspectRatio="none">
                <line x1="12" y1="0" x2="12" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                <line x1="24" y1="0" x2="24" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                <line x1="36" y1="0" x2="36" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                <line x1="0" y1="9" x2="48" y2="9" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                <line x1="0" y1="18" x2="48" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              </svg>
            )}
            {config.backgroundType === 'preset' && config.backgroundStyle === 'drafting' && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 27" preserveAspectRatio="none">
                {[8,16,24,32,40].map(x => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={27} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>)}
                {[7,14,20].map(y => <line key={`h${y}`} x1={0} y1={y} x2={48} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>)}
                <path d="M 14 27 A 20 20 0 0 1 34 27" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"/>
              </svg>
            )}
            {config.backgroundType === 'code' && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                <span className="text-zinc-400 text-xs font-mono">{'</>'} Code</span>
              </div>
            )}
            {config.backgroundType === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60">
                <span className="text-zinc-400 text-xs">Video</span>
              </div>
            )}
          </div>
          <span className="block text-[11px] text-zinc-400 mt-1.5 text-left">
            {config.backgroundType === 'preset'
              ? BG_STYLE_LABELS[config.backgroundStyle ?? 'chalkboard'] ?? 'Custom'
              : config.backgroundType === 'image'
              ? 'Custom Image'
              : config.backgroundType === 'video'
              ? 'Custom Video'
              : 'Code Background'}
          </span>
        </button>
      </Section>

      {/* ── Animation Speed ────────────────────────────────────── */}
      <Section icon={Zap} title="Animation">
        <PanelSlider
          label="Speed"
          value={animSpeed}
          onChange={setAnimSpeed}
          min={5}
          max={120}
          step={1}
          suffix="f"
        />
      </Section>

      {/* ── Help Hint ──────────────────────────────────────────── */}
      {!enabled && (
        <div className="py-6 text-center text-zinc-500 text-[11px]">
          Enable whiteboard mode to start drawing animated strokes on your canvas.
        </div>
      )}
    </PanelLayout>
  )
}
