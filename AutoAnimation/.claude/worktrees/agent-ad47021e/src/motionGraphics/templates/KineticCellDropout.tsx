import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CellDropoutConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Signal bar heights (1-5 bars)
function SignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          width: 4,
          height: 4 + i * 3,
          borderRadius: 1,
          background: i < bars ? color : 'rgba(255,255,255,0.08)',
          transition: 'background 0.1s',
        }} />
      ))}
    </div>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Signal bars drop as call fails
    const signalBars = Math.max(0, Math.min(5, Math.floor(
      (Math.sin(time * 0.7 + 1.2) * 0.5 + 0.5) * 6
    )))
    const isLow = signalBars <= 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Status bar at top */}
        <div style={{
          position: 'absolute', top: 10, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: 10, fontWeight: 600,
            color: isLow ? 'rgba(255,60,60,0.4)' : 'rgba(255,255,255,0.15)',
            letterSpacing: 0.5,
          }}>
            {isLow ? 'NO SERVICE' : 'LTE'}
          </div>
          <SignalBars bars={signalBars} color={isLow ? 'rgba(255,60,60,0.5)' : 'rgba(255,255,255,0.3)'} />
        </div>
        {/* Pixelation grid overlay — subtle always-on */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(0,0,0,0.04) 7px, rgba(0,0,0,0.04) 8px), repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(0,0,0,0.04) 7px, rgba(0,0,0,0.04) 8px)',
          pointerEvents: 'none',
        }} />
        {/* Reconnecting label when signal is low */}
        {isLow && (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9, color: 'rgba(255,60,60,0.3)',
            letterSpacing: 2,
            opacity: Math.sin(time * 5) > 0 ? 1 : 0,
          }}>
            RECONNECTING...
          </div>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 113 + 61

    if (phase === 'enter') {
      // Text arrives fine, then immediately pixelates/freezes, then reconnects
      // 0..0.3: text comes in cleanly
      // 0.3..0.65: signal drops — text pixelates and freezes
      // 0.65..1.0: reconnects and clears
      const chars = word.split('').map((ch, ci) => {
        if (enterProgress < 0.3) {
          // Clean arrival — slide in from bottom per character with stagger
          const charDelay = (ci / word.length) * 0.2
          const charP = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.3))
          return (
            <span key={ci} style={{
              display: 'inline-block',
              opacity: charP,
              transform: `translateY(${(1 - charP) * 12}px)`,
              color,
            }}>
              {ch}
            </span>
          )
        } else if (enterProgress < 0.65) {
          // Frozen/pixelated — character either shows correctly or shows a block
          const freezeProgress = (enterProgress - 0.3) / 0.35
          // Characters mid-word freeze first — simulate codec freeze
          const freezeOrder = rand(seed + ci * 47) < freezeProgress
          const isBlock = freezeOrder && rand(seed + ci * 89 + Math.floor(f / 6)) > 0.4
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: isBlock ? 'rgba(0,200,255,0.6)' : color,
              filter: freezeOrder ? `blur(${freezeProgress * 1.5}px)` : undefined,
              opacity: isBlock ? 0.7 : 1,
            }}>
              {isBlock ? '█' : ch}
            </span>
          )
        } else {
          // Reconnect — clear up char by char from left
          const clearP = Math.max(0, Math.min(1, (enterProgress - 0.65 - ci / word.length * 0.25) / 0.35))
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: clearP > 0.8 ? color : 'rgba(0,200,255,0.7)',
              filter: clearP < 1 ? `blur(${(1 - clearP) * 2}px)` : undefined,
              opacity: 0.6 + clearP * 0.4,
            }}>
              {clearP < 0.5 ? '█' : ch}
            </span>
          )
        }
      })

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable — one brief dropout at ~0.45
      const dropout = holdProgress > 0.42 && holdProgress < 0.52
      const dropSeed = 999

      const chars = word.split('').map((ch, ci) => {
        if (dropout) {
          const isAffected = rand(dropSeed + ci * 37) > 0.5
          const isBlock = isAffected && rand(dropSeed + ci * 71 + f) > 0.3
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: isBlock ? 'rgba(0,200,255,0.6)' : color,
              opacity: isAffected ? 0.5 + rand(dropSeed + ci + f) * 0.5 : 1,
            }}>
              {isBlock ? '▓' : ch}
            </span>
          )
        }
        return <span key={ci} style={{ color }}>{ch}</span>
      })

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          textTransform: 'uppercase',
          textShadow: dropout ? 'none' : `0 0 6px ${color}30`,
        }}>
          {chars}
        </div>
      )
    } else {
      // Exit: call drops — text pixelates and freezes out
      const chars = word.split('').map((ch, ci) => {
        const charDropTime = rand(seed + ci * 61 + 200)
        const isDropped = charDropTime < exitProgress
        const freezeSeed = seed + ci * 83
        const isBlock = isDropped && rand(freezeSeed + f) > 0.4

        return (
          <span key={ci} style={{
            display: 'inline-block',
            color: isDropped ? 'rgba(0,200,255,0.4)' : color,
            opacity: isDropped ? Math.max(0, 1 - (exitProgress - charDropTime) * 3) : 1,
          }}>
            {isBlock ? '█' : ch}
          </span>
        )
      })

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          {chars}
        </div>
      )
    }
  },
}

function CellDropoutComponent(props: MotionGraphicProps<CellDropoutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cell-dropout',
  title: 'Kinetic Cell Dropout',
  description: 'Cell signal dropout — text pixelates and freezes mid-word when signal drops, reconnects character by character with signal bar indicator',
  tags: ['kinetic', 'typography', 'glitch', 'cell', 'signal', 'dropout', 'mobile', 'pixelate', 'freeze', 'transmission'],
  category: 'captions',
  component: CellDropoutComponent as any,
  defaultConfig: {
    words: ['CALLING', 'DROPPED', 'HELLO?', 'LOST'],
    colors: ['#FFFFFF', '#00C8FF', '#FFFFFF', '#FF4040'],
    bgColor: '#070709',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CALLING', 'DROPPED', 'HELLO?', 'LOST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00C8FF', '#FFFFFF', '#FF4040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#070709', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
