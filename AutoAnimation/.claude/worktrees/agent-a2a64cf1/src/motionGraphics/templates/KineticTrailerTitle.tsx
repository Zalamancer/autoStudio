import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrailerTitleConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Subtle deep screen pulse — "bass" visual
    const pulse = Math.sin(time * 3) * 0.015
    const brightness = 1 + pulse

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          filter: `brightness(${brightness})`,
        }}
      >
        {/* Dark atmospheric gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30,30,50,0.4), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let letterSpacingPx = 12

    if (phase === 'enter') {
      // Dramatic word appearance — slight scale with expo ease
      const eased = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 1.15 - eased * 0.15
      letterSpacingPx = 30 - eased * 18
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle scale pulse during hold for dramatic tension
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.008
    } else {
      opacity = 1 - easeOutExpo(exitProgress)
      scale = 1 - exitProgress * 0.1
    }

    // Screen pulse on enter impact
    const impactPulse =
      phase === 'enter' && enterProgress > 0.7
        ? Math.sin((enterProgress - 0.7) * 33) * (1 - enterProgress) * 2
        : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${impactPulse}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(44px, 14vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: `${letterSpacingPx}px`,
          color,
          textShadow:
            '0 0 40px rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function TrailerTitleComponent(props: MotionGraphicProps<TrailerTitleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-trailer-title',
  title: 'Kinetic Trailer Title',
  description:
    'Movie trailer dramatic title — "IN A WORLD..." style with word-by-word reveal, subtle scale, and deep screen pulse',
  tags: ['kinetic', 'typography', 'trailer', 'dramatic', 'epic', 'movie', 'cinematic'],
  category: 'captions',
  component: TrailerTitleComponent as any,
  defaultConfig: {
    words: ['IN A WORLD', 'WHERE HOPE', 'IS LOST', 'ONE HERO'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#E0E0E0'],
    bgColor: '#050510',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['IN A WORLD', 'WHERE HOPE', 'IS LOST', 'ONE HERO'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#E0E0E0'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#050510',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
