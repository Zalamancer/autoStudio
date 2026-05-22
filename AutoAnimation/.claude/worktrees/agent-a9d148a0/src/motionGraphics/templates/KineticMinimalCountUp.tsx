import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCountUpConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Attempts to parse a numeric value from a word.
 * For purely numeric strings, counts from 0 up to that number.
 * For non-numeric strings, shows the word directly.
 */
function getDisplayValue(word: string, progress: number): string {
  const trimmed = word.trim()
  const numeric = parseFloat(trimmed)

  if (!isNaN(numeric) && String(numeric) === trimmed) {
    // Pure integer or float — count up
    const isFloat = trimmed.includes('.')
    const current = numeric * progress
    if (isFloat) {
      const decimals = (trimmed.split('.')[1] ?? '').length
      return current.toFixed(decimals)
    }
    return String(Math.round(current))
  }

  // Not numeric — show the word as-is (still with fade effect)
  return word
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let countProgress = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      // Count up during enter: 0 → target value
      countProgress = eased
    } else if (phase === 'hold') {
      opacity = 1
      // Settled at final value; a small residual motion adds realism
      countProgress = 1
      void holdProgress
    } else {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      countProgress = 1
    }

    const displayValue = getDisplayValue(word, countProgress)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayValue}
        </div>
      </div>
    )
  },
}

function MinimalCountUpComponent(props: MotionGraphicProps<MinimalCountUpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-count-up',
  title: 'Minimal Count Up',
  description:
    'Numbers count up from 0 to the target value during the enter phase. Pure numeric text animation — single property: the displayed number.',
  tags: ['kinetic', 'typography', 'minimal', 'count', 'number', 'counter', 'numeric', 'odometer', 'stats'],
  category: 'captions',
  component: MinimalCountUpComponent as any,
  defaultConfig: {
    words: ['100', '1000', '42', '99'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Numbers',
      type: 'text-array',
      defaultValue: ['100', '1000', '42', '99'],
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
      defaultValue: 1.5,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
