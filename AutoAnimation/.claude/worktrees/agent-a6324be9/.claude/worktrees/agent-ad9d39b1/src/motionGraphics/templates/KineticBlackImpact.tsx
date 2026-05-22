import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlackImpactConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Black Impact Stamp — weight 900 type slammed onto the frame like a rubber
 * stamp. The word arrives instantaneously at maximum scale (120%) then the
 * "ink" settles: scale contracts and the letterforms settle into final weight.
 * During hold, the text stays at extreme Black weight with a barely perceptible
 * ink-settle — a tiny scale oscillation as the stamp dries. Exit: the stamp
 * lifts — scale jumps, opacity cuts, like a printer lifting from the page.
 * Uses condensed/compressed font styling for maximum ink density.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Stamp registration marks */}
      {[
        { top: '6%', left: '6%' }, { top: '6%', right: '6%' },
        { bottom: '6%', left: '6%' }, { bottom: '6%', right: '6%' },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            ...pos,
            borderTop: '1.5px solid rgba(0,0,0,0.12)',
            borderLeft: i % 2 === 0 ? '1.5px solid rgba(0,0,0,0.12)' : undefined,
            borderRight: i % 2 === 1 ? '1.5px solid rgba(0,0,0,0.12)' : undefined,
            borderBottom: i > 1 ? '1.5px solid rgba(0,0,0,0.12)' : undefined,
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.16, height * 0.20, 148)

    let scale: number
    let opacity: number
    let blur: number = 0
    let skewX: number = 0

    if (phase === 'enter') {
      if (enterProgress < 0.12) {
        // Instantaneous slam — arrive at 120% in first 12%
        const t = enterProgress / 0.12
        scale = 0.6 + t * 0.6 // 0.6 → 1.2
        opacity = Math.min(1, t * 3)
        blur = (1 - t) * 4
      } else {
        // Ink settle: scale back from 1.2 to 1.0 with overshoot
        const t = easeOutExpo((enterProgress - 0.12) / 0.88)
        scale = 1.2 - t * 0.2 // 1.2 → 1.0
        opacity = 1
        blur = 0
      }
    } else if (phase === 'hold') {
      // Ink settling oscillation — nearly imperceptible
      const settle = Math.sin(holdProgress * Math.PI * 5) * Math.exp(-holdProgress * 6) * 0.015
      scale = 1 + settle
      opacity = 1
    } else {
      // Lift: stamp pulls up — scale spike then gone
      if (exitProgress < 0.3) {
        const t = exitProgress / 0.3
        scale = 1 + t * 0.1 // lift slightly
        opacity = 1
      } else {
        const t = (exitProgress - 0.3) / 0.7
        scale = 1.1 + t * 0.2
        opacity = 1 - easeInQuad(t)
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "'Impact', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: 900,
            fontVariationSettings: '"wght" 900',
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            lineHeight: 0.88,
            color,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BlackImpactComponent(props: MotionGraphicProps<BlackImpactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-black-impact',
  title: 'Black Impact Stamp',
  description:
    'Weight 900 type slams onto the frame like a rubber stamp at 120% scale, then the ink settles back to 100%. Registration marks frame the canvas. Stamp lifts on exit. Extreme weight, extreme compression, maximum ink density.',
  tags: ['kinetic', 'typography', 'font-weight', 'black', 'stamp', 'impact', 'slam', 'bold', 'craft'],
  category: 'captions',
  component: BlackImpactComponent as any,
  defaultConfig: {
    words: ['STAMP', 'INK', 'PRESS', 'MARK'],
    colors: ['#0a0a0a', '#111', '#0a0a0a', '#111'],
    bgColor: '#f0ece5',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STAMP', 'INK', 'PRESS', 'MARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0a0a0a', '#111', '#0a0a0a', '#111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0ece5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.8, max: 4, group: 'Timing' },
  ],
})
