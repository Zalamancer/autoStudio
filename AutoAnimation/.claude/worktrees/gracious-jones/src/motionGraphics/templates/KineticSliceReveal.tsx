import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Horizontal clip-path wipe: text is revealed left-to-right on enter,
// then wiped away right-to-left on exit. Single CSS property, zero fatigue.

interface SliceRevealConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let clipLeft: number
    let clipRight: number
    let opacity: number

    if (phase === 'enter') {
      const ep = easeOutQuart(enterProgress)
      // Reveal from left: clip-path inset goes from (0% 100% 0% 0%) to (0% 0% 0% 0%)
      clipLeft = 0
      clipRight = (1 - ep) * 100
      opacity = 0.4 + ep * 0.6
    } else if (phase === 'hold') {
      clipLeft = 0
      clipRight = 0
      opacity = 1
    } else {
      // Wipe out to the right: clip-path inset left grows
      const ep = easeInQuart(exitProgress)
      clipLeft = ep * 100
      clipRight = 0
      opacity = 1 - ep * 0.3
    }

    const clipPath = `inset(0% ${clipRight.toFixed(1)}% 0% ${clipLeft.toFixed(1)}%)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          clipPath,
          willChange: 'clip-path, opacity',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 400,
            letterSpacing: '0.03em',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SliceRevealComponent(props: MotionGraphicProps<SliceRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slice-reveal',
  title: 'Slice Reveal',
  description: 'Text is revealed left-to-right via a horizontal clip-path wipe, then wiped away. Single-property, zero fatigue — built for word-by-word subtitles.',
  tags: ['kinetic', 'typography', 'subtitle', 'caption', 'wipe', 'clip-path', 'minimal', 'clean', 'fast'],
  category: 'captions',
  component: SliceRevealComponent as any,
  defaultConfig: {
    words: ['CLEAN', 'FAST', 'CLEAR', 'EASY'],
    colors: ['#111111', '#222222', '#111111', '#222222'],
    bgColor: '#ffffff',
    cycleDuration: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CLEAN', 'FAST', 'CLEAR', 'EASY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#111111', '#222222'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
