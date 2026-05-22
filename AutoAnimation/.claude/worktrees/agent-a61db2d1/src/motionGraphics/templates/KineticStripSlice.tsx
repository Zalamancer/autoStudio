import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Shatter/Fragment 3: Strip Slice ──────────────────────────────────────────
// Text is sliced into horizontal strips that slide apart, revealing nothing,
// then slam back together.

interface StripSliceConfig extends KineticBaseConfig {
  stripCount: number
  slideDistance: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (Math.PI * 2) / 3) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Horizontal rule lines at strip boundaries (background) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0%,
          transparent calc(12.5% - 1px),
          rgba(255,255,255,0.05) calc(12.5% - 1px),
          rgba(255,255,255,0.05) 12.5%
        )`,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const STRIPS = 8
    const stripH = height / STRIPS

    const strips = Array.from({ length: STRIPS }, (_, i) => {
      // Alternate strips slide left/right
      const direction = i % 2 === 0 ? 1 : -1
      // Stagger: middle strips move first
      const distFromMid = Math.abs(i - (STRIPS - 1) / 2) / ((STRIPS - 1) / 2)
      const stagger = distFromMid * 0.25

      let tx = 0, op = 1

      if (phase === 'enter') {
        // Strips start far apart, slam together
        const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
        const e = easeOutElastic(p)
        tx = direction * width * 1.2 * (1 - e)
        op = Math.min(1, p * 2)
      } else if (phase === 'hold') {
        // Strips in place with micro-drift
        tx = direction * Math.sin(holdProgress * Math.PI * 4 + i * 0.5) * 2
        op = 1
      } else {
        // Strips fly out in opposite directions
        const p = Math.max(0, Math.min(1, (exitProgress - stagger * 0.5) / (1 - stagger * 0.3)))
        const e = easeInCubic(p)
        tx = -direction * width * 1.4 * e
        op = 1 - e * 0.8
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: i * stripH,
            width: '100%',
            height: stripH,
            overflow: 'hidden',
            transform: `translateX(${tx}px)`,
            opacity: op,
          }}
        >
          {/* Each strip renders its slice of the text */}
          <div
            style={{
              position: 'absolute',
              top: -i * stripH,
              left: 0,
              width: '100%',
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Impact', 'Haettenschweiler', sans-serif",
                fontSize: 'clamp(52px, 12vw, 152px)',
                fontWeight: 900,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                textShadow: `2px 0 0 rgba(255,255,255,0.1)`,
              }}
            >
              {word}
            </span>
          </div>
          {/* Strip edge accent */}
          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: 1,
              background: `linear-gradient(to right, transparent, ${color}40, transparent)`,
            }}
          />
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {strips}
      </div>
    )
  },
}

function StripSliceComponent(props: MotionGraphicProps<StripSliceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-strip-slice',
  title: 'Kinetic Strip Slice',
  description: 'Text sliced into horizontal strips that fly in from alternating sides with elastic overshoot, then shear apart on exit.',
  tags: ['kinetic', 'typography', 'slice', 'strip', 'shatter', 'fragment', 'shear', 'impact'],
  category: 'captions',
  component: StripSliceComponent as any,
  defaultConfig: {
    words: ['SLICE', 'CUT', 'SHARP', 'EDGE'],
    colors: ['#FFFFFF', '#FF3355', '#FFFFFF', '#FFAA00'],
    bgColor: '#080808',
    cycleDuration: 1.3,
    stripCount: 8,
    slideDistance: 400,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLICE', 'CUT', 'SHARP', 'EDGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF3355', '#FFFFFF', '#FFAA00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'stripCount', label: 'Strip Count', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Animation' },
    { key: 'slideDistance', label: 'Slide Distance', type: 'number', defaultValue: 400, min: 100, max: 800, group: 'Animation' },
  ],
})
