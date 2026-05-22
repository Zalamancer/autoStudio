import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DifferenceBlendConfig extends KineticBaseConfig {
  waveCount: number
  invertSpeed: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Animated gradient waves that interact with the difference blend
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Moving color wave panels for difference-blend interaction */}
        {[0, 1, 2].map((i) => {
          const waveX = (Math.sin(t * 0.8 + i * 2.1) * 0.3 + 0.5) * 100
          const waveY = (Math.cos(t * 0.6 + i * 1.7) * 0.2 + 0.5) * 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at ${waveX}% ${waveY}%, hsl(${i * 120 + t * 20}, 70%, 40%) 0%, transparent 60%)`,
                mixBlendMode: 'difference',
                opacity: 0.4,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let invertP = 0
    let resolveP = 0
    let fadeP = 0

    if (phase === 'enter') {
      // Start fully inverted, resolve to normal
      invertP = Math.max(0, 1 - easeOutExpo(enterProgress))
      resolveP = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      invertP = 0
      resolveP = 1
      // Subtle pulsing inversion on hold
      invertP = Math.sin(holdProgress * Math.PI * 2) * 0.06
    } else {
      resolveP = 1
      invertP = 0
      fadeP = easeInCubic(exitProgress)
    }

    const textOpacity = 1 - fadeP

    // The "difference" visual effect: multiple copies of the text at different
    // offsets interact to produce color artifacts via the blend mode
    const copies = [
      { offsetX: -4, offsetY: -2, delay: 0, blendMode: 'difference' as const },
      { offsetX: 4, offsetY: 2, delay: 0.08, blendMode: 'difference' as const },
      { offsetX: 0, offsetY: -3, delay: 0.16, blendMode: 'exclusion' as const },
      { offsetX: 0, offsetY: 0, delay: 0.3, blendMode: 'normal' as const },
    ]

    const copyProgress = copies.map((cp) => {
      const cp_p = Math.max(0, Math.min(1, (resolveP - cp.delay) / (1 - cp.delay + 0.01)))
      return easeOutExpo(cp_p)
    })

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: Math.max(0, textOpacity) }}>
        {copies.map((cp, i) => {
          const cp_resolved = copyProgress[i]
          // Offset shrinks as the copy resolves to the final position
          const curX = cp.offsetX * (1 - cp_resolved) * 8
          const curY = cp.offsetY * (1 - cp_resolved) * 8
          const cpOpacity = i === copies.length - 1 ? cp_resolved : cp_resolved * 0.8

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px))`,
                mixBlendMode: cp.blendMode,
                opacity: Math.max(0, cpOpacity),
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color: i === copies.length - 1 ? color : '#FFFFFF',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  filter: i < copies.length - 1 ? `invert(${invertP})` : 'none',
                }}
              >
                {word}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function DifferenceBlendComponent(props: MotionGraphicProps<DifferenceBlendConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-difference-blend',
  title: 'Kinetic Difference Blend',
  description:
    'Text copies appear offset and inverted, resolving through difference and exclusion blend modes — color interference patterns collapse into the final sharp text as copies align.',
  tags: [
    'kinetic',
    'typography',
    'difference',
    'blend',
    'exclusion',
    'invert',
    'layer',
    'composite',
    'glitch',
    'build',
  ],
  category: 'captions',
  component: DifferenceBlendComponent as any,
  defaultConfig: {
    words: ['INVERT', 'DIFFER', 'EXCLUDE', 'RESOLVE'],
    colors: ['#FFFFFF', '#F0F0F0', '#E0E0FF', '#FFE0E0'],
    bgColor: '#111111',
    cycleDuration: 2.0,
    waveCount: 3,
    invertSpeed: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['INVERT', 'DIFFER', 'EXCLUDE', 'RESOLVE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#F0F0F0', '#E0E0FF', '#FFE0E0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'waveCount', label: 'Wave Count', type: 'number', defaultValue: 3, min: 1, max: 5, group: 'Animation' },
    {
      key: 'invertSpeed',
      label: 'Invert Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 3,
      group: 'Animation',
    },
  ],
})
