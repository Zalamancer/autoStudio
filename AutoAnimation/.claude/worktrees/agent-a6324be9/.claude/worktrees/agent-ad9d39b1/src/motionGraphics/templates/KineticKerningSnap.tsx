import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KerningSnapConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Deterministic per-letter kerning offset (bad kerning = large spread) */
function badKerningOffset(charIndex: number, wordIndex: number): number {
  // Each letter gets a seeded, exaggerated offset from correct position
  const seed = charIndex * 17 + wordIndex * 53
  const sign = ((seed % 2) === 0) ? 1 : -1
  return sign * (30 + (seed % 7) * 18) // 30px to 138px spread
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Baseline guide */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          right: '5%',
          top: '50%',
          height: 2,
          background: 'rgba(255,255,255,0.05)',
          transform: 'translateY(32px)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.15, height * 0.18, 120)
    const charSpacing = fontSize * 0.62 // tight normal spacing

    const letters = word.split('')
    const totalNormalW = letters.length * charSpacing
    const startX = (width - totalNormalW) / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < letters.length; i++) {
      const normalX = startX + i * charSpacing
      const offsetX = badKerningOffset(i, index)

      let x: number
      let opacity: number
      let charScale: number = 1

      if (phase === 'enter') {
        if (enterProgress < 0.3) {
          // Phase 1: letters appear at bad-kerning positions
          const t = enterProgress / 0.3
          opacity = t
          x = normalX + offsetX * (1 - t * 0.1)
        } else {
          // Phase 2: snap into correct kerning
          const t = easeOutElastic(Math.min(1, (enterProgress - 0.3) / 0.7))
          opacity = 1
          x = normalX + offsetX * (1 - t)
        }
        charScale = 0.85 + enterProgress * 0.15
      } else if (phase === 'hold') {
        x = normalX
        opacity = 1
        // Very subtle micro-nudge to emphasize perfect spacing
        charScale = 1 + Math.sin(holdProgress * Math.PI * 2 + i * 0.5) * 0.01
      } else {
        // Exit: letters spread back out and fade
        const t = easeInOutCubic(exitProgress)
        x = normalX + offsetX * t * 0.6
        opacity = 1 - exitProgress * exitProgress
        charScale = 1
      }

      // Kerning indicator lines between letters during hold
      const showGuide = phase === 'hold' && i < letters.length - 1

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: x,
            transform: `translateY(-50%) scale(${charScale})`,
            fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight: 700,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {letters[i]}
        </div>
      )

      if (showGuide) {
        els.push(
          <div
            key={`guide-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: x + fontSize * 0.55,
              width: charSpacing - fontSize * 0.55,
              height: 1,
              background: `${color}28`,
              transform: 'translateY(32px)',
              opacity: easeInOutCubic(holdProgress) * 0.6,
            }}
          />
        )
      }
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function KerningSnapComponent(props: MotionGraphicProps<KerningSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kerning-snap',
  title: 'Kerning Snap',
  description:
    'Letters appear at randomly bad-kerned positions — wildly spaced apart — then snap into perfect typographic spacing with an elastic rebound. Fine kerning guide lines appear at rest.',
  tags: ['kinetic', 'typography', 'kerning', 'spacing', 'snap', 'elastic', 'typesetting', 'serif'],
  category: 'captions',
  component: KerningSnapComponent as any,
  defaultConfig: {
    words: ['KERN', 'SPACE', 'TRACK', 'PAIR'],
    colors: ['#F9F5FF', '#C4B5FD', '#8B5CF6', '#EDE9FE'],
    bgColor: '#0f0a1a',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['KERN', 'SPACE', 'TRACK', 'PAIR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F9F5FF', '#C4B5FD', '#8B5CF6', '#EDE9FE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
  ],
})
