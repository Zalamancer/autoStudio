import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalTypeInConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const n = chars.length

    // How many characters are visible at this moment
    let visibleCount = 0
    if (phase === 'enter') {
      visibleCount = Math.floor(enterProgress * n)
    } else if (phase === 'hold') {
      visibleCount = n
    } else {
      // Exit: erase from right to left
      visibleCount = Math.ceil((1 - exitProgress) * n)
    }

    // Cursor blink: 8fps blink while typing, steady when held
    const cursorVisible =
      phase === 'hold'
        ? true
        : Math.floor((frame ?? 0) / 4) % 2 === 0

    // Show cursor after the last visible character during enter/hold, hide on exit
    const showCursor = phase !== 'exit' || visibleCount < n

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 8vw, 120px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color,
              opacity: i < visibleCount ? 1 : 0,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
        {/* Cursor */}
        {showCursor && (
          <span
            style={{
              display: 'inline-block',
              width: '0.06em',
              height: '1em',
              background: color,
              opacity: cursorVisible ? 0.9 : 0,
              marginLeft: '0.04em',
              verticalAlign: 'middle',
            }}
          />
        )}
      </div>
    )
  },
}

function MinimalTypeInComponent(props: MotionGraphicProps<MinimalTypeInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-type-in',
  title: 'Minimal Type-In',
  description:
    'A blinking cursor types each character one by one, then erases on exit. Clean monospace-style typewriter effect.',
  tags: ['kinetic', 'minimal', 'typewriter', 'cursor', 'type', 'stagger', 'sequence', 'character'],
  category: 'captions',
  component: MinimalTypeInComponent as any,
  defaultConfig: {
    words: ['TYPE', 'WRITE', 'CODE', 'INPUT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TYPE', 'WRITE', 'CODE', 'INPUT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#333333', '#111111'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
