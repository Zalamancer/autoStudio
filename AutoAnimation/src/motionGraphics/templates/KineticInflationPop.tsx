import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Compression/Expansion 3: Inflation Pop ───────────────────────────────────
// Text inflates like a balloon — starts tiny/flat, expands with rounded
// puffiness, overshoot, then deflates to exit.

interface InflationPopConfig extends KineticBaseConfig {
  maxInflation: number
  puffiness: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Soft vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)`,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')

    // Per-char inflation with stagger
    const charElements = chars.map((ch, ci) => {
      const staggerDelay = (ci / Math.max(1, chars.length - 1)) * 0.3

      let sc = 0, scX = 1, scY = 1, op = 0, blur = 0, tx = 0, ty = 0
      let letterSpacing = '0em'
      let shadowBlur = 0

      if (phase === 'enter') {
        const p = Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (1 - staggerDelay * 0.6)))
        const e = easeOutBack(p)
        sc = e
        // Balloon puffing: slight horizontal stretch during inflation
        scX = 1 + Math.sin(p * Math.PI) * 0.25
        scY = 1 - Math.sin(p * Math.PI) * 0.1
        op = Math.min(1, p * 3)
        blur = (1 - Math.min(1, p * 2)) * 8
        shadowBlur = e * 20
      } else if (phase === 'hold') {
        // Gentle bobbing like a balloon
        sc = 1 + Math.sin(holdProgress * Math.PI * 2.5 + ci * 0.5) * 0.04
        scX = 1 + Math.cos(holdProgress * Math.PI * 3 + ci * 0.7) * 0.02
        scY = 1 - Math.cos(holdProgress * Math.PI * 2.5 + ci * 0.5) * 0.03
        ty = Math.sin(holdProgress * Math.PI * 2 + ci * 0.6) * 6
        op = 1
        shadowBlur = 15
      } else {
        // Deflate: shrink fast with squish
        const p = easeInCubic(exitProgress)
        sc = Math.max(0.01, 1 - p * 0.99)
        scX = 1 + p * 2  // deflating sideways first
        scY = 1 - p * 0.9
        op = 1 - p * 0.8
        blur = p * 10
      }

      // Glow effect grows with inflation
      const glowColor = color
      const textShadow = `0 0 ${shadowBlur}px ${glowColor}80, 0 ${shadowBlur * 0.3}px ${shadowBlur * 0.8}px rgba(0,0,0,0.5)`

      return (
        <div
          key={ci}
          style={{
            display: 'inline-block',
            fontFamily: "'Arial Rounded MT Bold', 'Nunito', 'Varela Round', sans-serif",
            fontSize: 'clamp(48px, 11vw, 148px)',
            fontWeight: 900,
            color,
            opacity: op,
            filter: `blur(${blur}px)`,
            transform: `translateY(${ty}px) scale(${sc}) scaleX(${scX}) scaleY(${scY})`,
            transformOrigin: 'center center',
            textShadow,
            lineHeight: 1.1,
          }}
        >
          {ch}
        </div>
      )
    })

    // Pop flash on enter complete
    const popFlashOp = phase === 'enter' && enterProgress > 0.85
      ? Math.max(0, (1 - (enterProgress - 0.85) / 0.15) * 0.3)
      : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Pop flash */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,1)',
          opacity: popFlashOp,
          borderRadius: '50%',
          transform: 'scale(2)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', whiteSpace: 'nowrap',
        }}>
          {charElements}
        </div>
      </div>
    )
  },
}

function InflationPopComponent(props: MotionGraphicProps<InflationPopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-inflation-pop',
  title: 'Kinetic Inflation Pop',
  description: 'Text inflates like a balloon with per-char stagger and overshoot — puffs sideways during inflation, bobs gently on hold, deflates rapidly on exit.',
  tags: ['kinetic', 'typography', 'inflate', 'balloon', 'expansion', 'pop', 'playful', 'bounce'],
  category: 'captions',
  component: InflationPopComponent as any,
  defaultConfig: {
    words: ['POP', 'PUFF', 'BIG', 'WOW'],
    colors: ['#FF6B9D', '#FF9500', '#4ECDC4', '#FFDD00'],
    bgColor: '#1a0530',
    cycleDuration: 1.3,
    maxInflation: 1.4,
    puffiness: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POP', 'PUFF', 'BIG', 'WOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#FF9500', '#4ECDC4', '#FFDD00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0530', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'maxInflation', label: 'Max Inflation', type: 'number', defaultValue: 1.4, min: 1.0, max: 2.5, group: 'Animation' },
    { key: 'puffiness', label: 'Puffiness', type: 'number', defaultValue: 1, min: 0.2, max: 2, group: 'Animation' },
  ],
})
