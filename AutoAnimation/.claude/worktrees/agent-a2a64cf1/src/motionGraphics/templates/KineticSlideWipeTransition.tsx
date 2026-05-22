import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlideWipeConfig extends KineticBaseConfig {
  wipeColor: string
}

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
    let clipRight = 100 // percentage hidden from right
    let barPosition = 0 // 0-100%
    let barOpacity = 0

    if (phase === 'enter') {
      const t = easeOutCubic(enterProgress)
      clipRight = 100 - t * 100 // 100 → 0 (reveal left to right)
      barPosition = t * 100
      barOpacity = 1
    } else if (phase === 'hold') {
      clipRight = 0
      barOpacity = 0
    } else {
      const t = easeInCubic(exitProgress)
      clipRight = t * 100 // 0 → 100 (hide left to right)
      barPosition = (1 - t) * 100
      barOpacity = 1
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Revealed word with clip */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            clipPath: phase === 'exit' ? `inset(0 0 0 ${clipRight}%)` : `inset(0 ${clipRight}% 0 0)`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {word}
        </div>
        {/* Wipe leading edge bar */}
        {barOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '30%',
              bottom: '30%',
              left: phase === 'exit' ? `${barPosition}%` : `${barPosition}%`,
              width: 4,
              background: '#FFD700',
              boxShadow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3)',
              opacity: barOpacity,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>
    )
  },
}

function SlideWipeTransitionComponent(props: MotionGraphicProps<SlideWipeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slide-wipe-transition',
  title: 'Kinetic Slide Wipe',
  description: 'Clean wipe reveal with a glowing accent bar sweeping across to reveal and hide each word',
  tags: ['kinetic', 'typography', 'transition', 'wipe', 'clean', 'professional'],
  category: 'captions',
  component: SlideWipeTransitionComponent as any,
  defaultConfig: {
    words: ['SWIPE', 'CLEAN', 'SHARP', 'WIPE'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.5,
    wipeColor: '#FFD700',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWIPE', 'CLEAN', 'SHARP'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'wipeColor', label: 'Wipe Bar Color', type: 'color', defaultValue: '#FFD700', group: 'Animation' },
  ],
})
