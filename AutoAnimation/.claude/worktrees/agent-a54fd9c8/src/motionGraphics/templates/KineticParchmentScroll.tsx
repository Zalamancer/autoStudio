import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ParchmentScrollConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, #2e2216 0%, ${bgColor} 100%)`,
        }}
      >
        {/* Ancient pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(139,109,76,0.03) 20px, rgba(139,109,76,0.03) 21px)',
          }}
        />
        {/* Scroll roll indicators on sides */}
        {['left', 'right'].map((side) => (
          <div
            key={side}
            style={{
              position: 'absolute',
              [side]: '3%',
              top: '15%',
              bottom: '15%',
              width: 'clamp(8px, 1.5vw, 16px)',
              background: 'linear-gradient(90deg, #5c422e, #8B6D4C, #5c422e)',
              borderRadius: 'clamp(4px, 0.75vw, 8px)',
              opacity: 0.25 + Math.sin(time * 0.8) * 0.05,
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            }}
          />
        ))}
        {/* Decorative corner flourishes */}
        {[
          { top: '8%', left: '8%' },
          { top: '8%', right: '8%' },
          { bottom: '8%', left: '8%' },
          { bottom: '8%', right: '8%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 'clamp(16px, 3vw, 30px)',
              height: 'clamp(16px, 3vw, 30px)',
              borderTop: i < 2 ? '2px solid rgba(201,169,110,0.15)' : 'none',
              borderBottom: i >= 2 ? '2px solid rgba(201,169,110,0.15)' : 'none',
              borderLeft: i % 2 === 0 ? '2px solid rgba(201,169,110,0.15)' : 'none',
              borderRight: i % 2 === 1 ? '2px solid rgba(201,169,110,0.15)' : 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    holdProgress,
    height: canvasHeight,
  }: WordRenderProps) => {
    let opacity = 0
    let clipY = 100
    let translateY = 0
    let scaleX = 1

    if (phase === 'enter') {
      // Scroll unrolls to reveal text vertically
      const unroll = 1 - Math.pow(1 - enterProgress, 2.5)
      clipY = (1 - unroll) * 100
      opacity = Math.min(1, enterProgress * 2)
      translateY = (1 - unroll) * 20
      // Parchment stretches slightly as it unrolls
      scaleX = 0.95 + unroll * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      clipY = 0
      // Ancient text shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 4) * 0.03
      scaleX = 1 + shimmer
    } else {
      // Scroll rolls back up
      const rollUp = exitProgress * exitProgress
      clipY = rollUp * 100
      opacity = 1 - rollUp
      translateY = rollUp * -15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX})`,
          opacity,
          clipPath: `inset(0 0 ${clipY}% 0)`,
        }}
      >
        {/* Parchment background */}
        <div
          style={{
            position: 'absolute',
            inset: '-20% -10%',
            background: 'linear-gradient(180deg, rgba(240,230,208,0.08) 0%, rgba(220,200,170,0.05) 100%)',
            borderRadius: 4,
            border: '1px solid rgba(201,169,110,0.1)',
          }}
        />
        {/* Decorative line above */}
        <div
          style={{
            position: 'absolute',
            top: '-25%',
            left: '10%',
            right: '10%',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Cinzel', 'Trajan Pro', 'Georgia', serif",
            fontSize: 'clamp(34px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: '0 2px 6px rgba(40,25,10,0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
        {/* Decorative line below */}
        <div
          style={{
            position: 'absolute',
            bottom: '-25%',
            left: '10%',
            right: '10%',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
          }}
        />
      </div>
    )
  },
}

function ParchmentScrollComponent(props: MotionGraphicProps<ParchmentScrollConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-parchment-scroll',
  title: 'Kinetic Parchment Scroll',
  description:
    'Text unrolls on ancient parchment with scroll roll animation, decorative corner flourishes, and warm golden tones',
  tags: ['kinetic', 'typography', 'parchment', 'scroll', 'ancient', 'literary', 'book', 'literature'],
  category: 'captions',
  component: ParchmentScrollComponent as any,
  defaultConfig: {
    words: ['SCROLL', 'ANCIENT', 'WISDOM', 'TALES'],
    colors: ['#C9A96E', '#B8976A', '#D4B896', '#9E8258'],
    bgColor: '#120e08',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SCROLL', 'ANCIENT', 'WISDOM', 'TALES'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C9A96E', '#B8976A', '#D4B896', '#9E8258'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#120e08', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
