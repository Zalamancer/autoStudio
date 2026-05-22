import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSlideApartConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('')
    const n = chars.length
    const mid = Math.ceil(n / 2)

    // Enter: halves start overlapping at center, slide apart to final positions
    // Exit: reverse — halves slide back together and fade out
    let slideAmount = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // At enterProgress=0: halves fully overlap (max slide = 0 from center outward)
      // Wait — we want them to START apart, slide TO the correct position
      // Actually: halves start overlapping at center, slide apart
      slideAmount = 1 - eased // 1 → 0 (collapsed → apart)
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      slideAmount = eased // 0 → 1 (apart → collapsed back together)
      opacity = 1 - eased
    }

    // Max offset in px at full collapse
    const maxOffset = 30

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'visible',
        }}
      >
        {chars.map((char, i) => {
          // First half (0..mid-1) shifts left on slide, second half (mid..n-1) shifts right
          const isFirstHalf = i < mid
          const direction = isFirstHalf ? -1 : 1
          const translateX = direction * slideAmount * maxOffset

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 300,
                letterSpacing: '0.05em',
                color,
                opacity,
                transform: `translateX(${translateX.toFixed(2)}px)`,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </div>
    )
  },
}

function MinimalSlideApartComponent(props: MotionGraphicProps<MinimalSlideApartConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-slide-apart',
  title: 'Minimal Slide Apart',
  description:
    'Word splits in half — both halves start overlapping at center and slide apart to their correct positions. Single translateX split motion.',
  tags: ['kinetic', 'typography', 'minimal', 'split', 'slide', 'apart', 'halves', 'reveal', 'center'],
  category: 'captions',
  component: MinimalSlideApartComponent as any,
  defaultConfig: {
    words: ['SPLIT', 'APART', 'OPEN', 'REVEAL'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPLIT', 'APART', 'OPEN', 'REVEAL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
