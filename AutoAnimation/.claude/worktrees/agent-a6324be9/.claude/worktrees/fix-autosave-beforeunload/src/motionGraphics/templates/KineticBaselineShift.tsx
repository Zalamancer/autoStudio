import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BaselineShiftConfig extends KineticBaseConfig {}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75 }
  if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375 }
  t -= 2.625 / d1
  return n1 * t * t + 0.984375
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Deterministic vertical offset for each letter — letters start on different baselines */
function startBaseline(charIndex: number, wordIndex: number, range: number): number {
  const seed = charIndex * 23 + wordIndex * 71
  // Use a simple hash: distribute across -range..+range with some variety
  const normalized = ((seed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff
  return (normalized - 0.5) * 2 * range
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Baseline rule */}
      <div
        style={{
          position: 'absolute',
          left: '4%',
          right: '4%',
          top: '50%',
          height: 2,
          background: 'rgba(255,255,255,0.07)',
          transform: 'translateY(28px)',
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
    const charSpacing = fontSize * 0.64
    const letters = word.split('')
    const totalW = letters.length * charSpacing
    const startX = (width - totalW) / 2
    const baselineY = height / 2

    // Max vertical displacement for starting baselines
    const maxOffset = height * 0.28

    const els: React.ReactNode[] = []

    for (let i = 0; i < letters.length; i++) {
      const x = startX + i * charSpacing
      const initOffsetY = startBaseline(i, index, maxOffset)

      let translateY: number
      let opacity: number
      let charScale: number = 1

      if (phase === 'enter') {
        // Staggered alignment: each char aligns on a slightly offset schedule
        const charDelay = (i / letters.length) * 0.4
        const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
        const eased = easeOutBounce(charT)
        translateY = initOffsetY * (1 - eased)
        opacity = charT > 0 ? 0.3 + charT * 0.7 : 0
      } else if (phase === 'hold') {
        translateY = 0
        opacity = 1
        // Micro baseline oscillation — letters breathe slightly
        translateY = Math.sin(holdProgress * Math.PI * 2 + i * 0.8) * 2
        charScale = 1 + Math.sin(holdProgress * Math.PI * 2 + i) * 0.008
      } else {
        // Exit: letters drift to different baselines again
        const eased = easeInOutQuad(exitProgress)
        translateY = initOffsetY * eased * 0.7
        opacity = 1 - exitProgress
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: baselineY,
            transform: `translateY(calc(-50% + ${translateY}px)) scale(${charScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: 800,
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
    }

    // Baseline label
    const labelOpacity = phase === 'hold' ? Math.min(1, holdProgress * 4) * 0.3 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: '50%',
            transform: 'translateY(30px)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          baseline
        </div>
      </div>
    )
  },
}

function BaselineShiftComponent(props: MotionGraphicProps<BaselineShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-baseline-shift',
  title: 'Baseline Shift',
  description:
    'Each letter starts on a different, chaotic vertical baseline. They animate individually with bounce easing to snap onto the shared typographic baseline, forming a perfectly aligned word.',
  tags: ['kinetic', 'typography', 'baseline', 'alignment', 'bounce', 'letters', 'typesetting', 'grid'],
  category: 'captions',
  component: BaselineShiftComponent as any,
  defaultConfig: {
    words: ['ALIGN', 'SETTLE', 'BASE', 'LINE'],
    colors: ['#FFF', '#FF6B6B', '#4ECDC4', '#FFE66D'],
    bgColor: '#0d1117',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ALIGN', 'SETTLE', 'BASE', 'LINE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FF6B6B', '#4ECDC4', '#FFE66D'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
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
