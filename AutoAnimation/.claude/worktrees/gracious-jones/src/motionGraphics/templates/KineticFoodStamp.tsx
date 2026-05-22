import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoodStampConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#FDF6E3'
          ? 'linear-gradient(135deg, #FDF6E3 0%, #F5E6C8 50%, #FDF6E3 100%)'
          : bgColor,
      }}
    >
      {/* Paper texture dots */}
      {Array.from({ length: 50 }, (_, i) => {
        const seed = i * 37 + 13
        const x = (seed * 11) % 100
        const y = (seed * 17) % 100
        const opacity = 0.02 + (seed % 4) * 0.008
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 1 + (seed % 2),
              height: 1 + (seed % 2),
              borderRadius: '50%',
              background: `rgba(139,90,43,${opacity})`,
              pointerEvents: 'none',
            }}
          />
        )
      })}
      {/* Craft paper edge stain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 0% 0%, rgba(139,90,43,0.06), transparent 40%), radial-gradient(ellipse at 100% 100%, rgba(139,90,43,0.06), transparent 40%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      // Stamp press down: quick scale from large + rotation
      if (enterProgress < 0.3) {
        const t = enterProgress / 0.3
        scale = 3 - t * 2.2 // 3 -> 0.8
        opacity = t
        rotate = -8 + t * 6
      } else if (enterProgress < 0.45) {
        // Impact bounce
        const t = (enterProgress - 0.3) / 0.15
        scale = 0.8 + t * 0.25
        opacity = 1
        rotate = -2 + t * 3
      } else if (enterProgress < 0.6) {
        const t = (enterProgress - 0.45) / 0.15
        scale = 1.05 - t * 0.05
        opacity = 1
        rotate = 1 - t * 1
      } else {
        scale = 1
        opacity = 1
        rotate = 0
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight wobble like freshly stamped
      rotate = Math.sin(index * 7 + 0.5) * 2.5
    } else {
      // Fade and lift
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      rotate = exitProgress * 5
    }

    const stampRotation = (index % 2 === 0 ? -3 : 2) + rotate

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${stampRotation}deg)`,
          opacity,
        }}
      >
        {/* Circular stamp border */}
        <div
          style={{
            position: 'relative',
            padding: 'clamp(20px, 4vw, 40px) clamp(30px, 6vw, 60px)',
            border: `4px solid ${color}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Top decorative line */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 12,
              right: 12,
              height: 2,
              background: color,
              opacity: 0.5,
            }}
          />
          {/* Stars row */}
          <div
            style={{
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              color,
              letterSpacing: 8,
              opacity: 0.7,
            }}
          >
            {'★ ★ ★'}
          </div>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(32px, 10vw, 120px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 6,
              color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
          {/* Subtitle */}
          <div
            style={{
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              fontFamily: "'Georgia', serif",
              color,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            CERTIFIED QUALITY
          </div>
          {/* Bottom decorative line */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 12,
              right: 12,
              height: 2,
              background: color,
              opacity: 0.5,
            }}
          />
        </div>
        {/* Ink splatter effect on stamp */}
        {phase === 'enter' && enterProgress > 0.3 && enterProgress < 0.6 && (
          <>
            {Array.from({ length: 5 }, (_, i) => {
              const dx = Math.cos(i * 1.3) * (30 + i * 8)
              const dy = Math.sin(i * 1.7) * (20 + i * 5)
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${dx}px)`,
                    top: `calc(50% + ${dy}px)`,
                    width: 3 + (i % 3),
                    height: 3 + (i % 3),
                    borderRadius: '50%',
                    background: color,
                    opacity: 0.3 * (1 - (enterProgress - 0.3) / 0.3),
                    pointerEvents: 'none',
                  }}
                />
              )
            })}
          </>
        )}
      </div>
    )
  },
}

function FoodStampComponent(props: MotionGraphicProps<FoodStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-food-stamp',
  title: 'Food Stamp',
  description: 'Rubber stamp certification style with press-down animation, ink splatter, decorative border with stars, on craft paper background',
  tags: ['kinetic', 'food', 'stamp', 'certified', 'organic', 'quality', 'seal', 'vintage'],
  category: 'captions',
  component: FoodStampComponent as any,
  defaultConfig: {
    words: ['ORGANIC', 'FRESH', 'LOCAL', 'PREMIUM'],
    colors: ['#8B2500', '#2E5E1A', '#8B2500', '#2E5E1A'],
    bgColor: '#FDF6E3',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ORGANIC', 'FRESH', 'LOCAL', 'PREMIUM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B2500', '#2E5E1A', '#8B2500', '#2E5E1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FDF6E3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
