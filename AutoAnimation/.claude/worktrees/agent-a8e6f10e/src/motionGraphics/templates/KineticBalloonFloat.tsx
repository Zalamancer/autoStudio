import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BalloonFloatConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const balloonColors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8E53', '#C77DFF', '#FF69B4']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}DD 60%, ${bgColor}BB 100%)`,
      }}
    >
      {/* Fluffy clouds */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${15 + i * 25}%`,
            left: `${10 + i * 30}%`,
            width: 'clamp(60px, 15vw, 120px)',
            height: 'clamp(30px, 6vw, 50px)',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '50px',
            filter: 'blur(4px)',
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
    index,
    height,
    frame = 0,
  }: WordRenderProps) => {
    const balloonColor = balloonColors[index % balloonColors.length]
    let opacity = 1
    let translateY = 0
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      // Float up from below
      const eased = easeOutBack(Math.min(1, enterProgress * 1.2))
      opacity = Math.min(1, enterProgress * 3)
      translateY = (1 - eased) * height * 0.5
      scale = 0.3 + eased * 0.7
      rotate = Math.sin(enterProgress * Math.PI * 3) * 10 * (1 - enterProgress)
    } else if (phase === 'hold') {
      // Gentle floating sway
      const time = holdProgress * 12
      translateY = Math.sin(time) * 15
      rotate = Math.sin(time * 0.7) * 5
      scale = 1 + Math.sin(time * 1.3) * 0.03
    } else {
      // Float away upward
      opacity = 1 - easeOutCubic(exitProgress)
      translateY = -exitProgress * height * 0.4
      scale = 1 - exitProgress * 0.3
      rotate = Math.sin(exitProgress * Math.PI * 2) * 15
    }

    const stringLength = 40 + Math.sin((holdProgress || 0) * 8) * 5

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Balloon body */}
        <div
          style={{
            position: 'relative',
            background: `radial-gradient(circle at 35% 30%, ${balloonColor}FF, ${balloonColor}CC 60%, ${balloonColor}88)`,
            borderRadius: '50% 50% 50% 50% / 55% 55% 45% 45%',
            padding: 'clamp(20px, 5vw, 50px) clamp(25px, 6vw, 60px)',
            minWidth: 'clamp(100px, 25vw, 240px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `inset -8px -8px 20px rgba(0,0,0,0.15), 4px 4px 16px rgba(0,0,0,0.1)`,
          }}
        >
          {/* Shine highlight */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '25%',
              width: '25%',
              height: '20%',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: '50%',
              filter: 'blur(6px)',
              transform: 'rotate(-30deg)',
            }}
          />
          {/* Word text */}
          <div
            style={{
              fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
              fontSize: 'clamp(28px, 8vw, 80px)',
              fontWeight: 700,
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {word}
          </div>
        </div>
        {/* Balloon knot */}
        <div
          style={{
            width: 'clamp(10px, 2vw, 16px)',
            height: 'clamp(10px, 2vw, 16px)',
            background: balloonColor,
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            marginTop: '-2px',
            filter: 'brightness(0.85)',
          }}
        />
        {/* String */}
        <div
          style={{
            width: '2px',
            height: `${stringLength}px`,
            background: `linear-gradient(180deg, ${balloonColor}80, rgba(150,150,150,0.4))`,
            borderRadius: '1px',
          }}
        />
      </div>
    )
  },
}

function BalloonFloatComponent(props: MotionGraphicProps<BalloonFloatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-balloon-float',
  title: 'Balloon Float',
  description:
    'Words float up like colorful balloons with strings. Gentle floating sway, shiny balloon highlights, and cloud background.',
  tags: ['kinetic', 'balloon', 'float', 'kids', 'cartoon', 'party', 'colorful', 'playful'],
  category: 'captions',
  component: BalloonFloatComponent as any,
  defaultConfig: {
    words: ['PARTY', 'FUN', 'YAY', 'HOORAY'],
    colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
    bgColor: '#E8F6FF',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PARTY', 'FUN', 'YAY', 'HOORAY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8F6FF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
