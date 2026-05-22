import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StarBurstConfig extends KineticBaseConfig {}

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

const starColors = ['#FFD700', '#FF6B6B', '#FF8E53', '#FFE66D', '#FFA07A', '#FFCC33']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let rotate = 0
    const starCount = 16

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = eased * 1.2
      rotate = (1 - enterProgress) * 180
      if (enterProgress > 0.7) {
        scale = 1.2 - (enterProgress - 0.7) / 0.3 * 0.2
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.05
      rotate = Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      scale = 1 + exitProgress * 0.5
      rotate = exitProgress * 90
    }

    // Star burst particles
    const burstProgress = phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1 - exitProgress
    const showStars = phase === 'enter' || (phase === 'hold' && holdProgress < 0.3)
    const starsOpacity = phase === 'enter'
      ? enterProgress
      : phase === 'hold'
        ? Math.max(0, 1 - holdProgress * 3.3)
        : 0

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
        {/* Burst ring */}
        {phase === 'enter' && enterProgress > 0.1 && enterProgress < 0.8 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${enterProgress * 400}px`,
              height: `${enterProgress * 400}px`,
              border: `3px solid ${color}40`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 1 - enterProgress,
            }}
          />
        )}

        {/* Star particles */}
        {showStars &&
          Array.from({ length: starCount }).map((_, i) => {
            const angle = (i / starCount) * Math.PI * 2 + seededRandom(index * 50 + i) * 0.5
            const dist = 40 + burstProgress * 160 * (0.6 + seededRandom(index * 50 + i + 10) * 0.4)
            const x = Math.cos(angle) * dist
            const y = Math.sin(angle) * dist
            const starSize = 8 + seededRandom(index * 50 + i + 20) * 14
            const starColor = starColors[i % starColors.length]
            const starRotate = burstProgress * 360 + seededRandom(index * 50 + i + 30) * 180

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${starSize}px`,
                  height: `${starSize}px`,
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${starRotate}deg)`,
                  opacity: starsOpacity * (0.5 + seededRandom(index * 50 + i + 40) * 0.5),
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  background: starColor,
                  filter: `drop-shadow(0 0 ${starSize * 0.3}px ${starColor})`,
                }}
              />
            )
          })}

        {/* Main text */}
        <div
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(40px, 12vw, 150px)',
            fontWeight: 700,
            color,
            transform: `scale(${scale}) rotate(${rotate}deg)`,
            textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30, 3px 3px 0 rgba(0,0,0,0.15)`,
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {word}
        </div>

        {/* Sparkle twinkles during hold */}
        {phase === 'hold' &&
          [0, 1, 2, 3].map((i) => {
            const twinkle = (Math.sin(holdProgress * 30 + i * 2.5) + 1) / 2
            const angle = (i / 4) * Math.PI * 2 + holdProgress * 3
            const dist = 100 + Math.sin(holdProgress * 8 + i) * 30
            return (
              <div
                key={`twinkle-${i}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  fontSize: `${12 + twinkle * 10}px`,
                  color: starColors[i % starColors.length],
                  transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`,
                  opacity: twinkle,
                  textShadow: `0 0 8px ${starColors[i % starColors.length]}`,
                }}
              >
                {'\u2726'}
              </div>
            )
          })}
      </div>
    )
  },
}

function StarBurstComponent(props: MotionGraphicProps<StarBurstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-star-burst',
  title: 'Star Burst',
  description:
    'Words appear with an explosive star burst. Colorful stars radiate outward, text scales in with rotation, sparkle twinkles during hold.',
  tags: ['kinetic', 'star', 'burst', 'explosion', 'kids', 'cartoon', 'celebration', 'sparkle'],
  category: 'captions',
  component: StarBurstComponent as any,
  defaultConfig: {
    words: ['WOW', 'STAR', 'BOOM', 'SHINE'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF69B4'],
    bgColor: '#1A1040',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WOW', 'STAR', 'BOOM', 'SHINE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF69B4'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1040', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
