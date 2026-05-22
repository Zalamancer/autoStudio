import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RacingStripeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    const stripeCount = 8
    const stripes = Array.from({ length: stripeCount }, (_, i) => {
      const baseY = (i / stripeCount) * 100
      const speed = 1.5 + (i % 3) * 0.8
      const offset = ((time * speed * 200) % (width * 2)) - width
      const h = 2 + (i % 3) * 1.5
      const opacity = 0.06 + (i % 4) * 0.03
      return { y: baseY, offset, h, opacity }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Racing stripes scrolling across */}
        {stripes.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${s.y}%`,
              left: 0,
              width: '200%',
              height: `${s.h}%`,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${s.opacity}) 30%, rgba(255,255,255,${s.opacity}) 70%, transparent 100%)`,
              transform: `translateX(${s.offset}px)`,
            }}
          />
        ))}
        {/* Center racing stripe (2 parallel lines) */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: 0,
            right: 0,
            height: '3%',
            background: 'rgba(255,50,50,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '51%',
            left: 0,
            right: 0,
            height: '3%',
            background: 'rgba(255,50,50,0.15)',
          }}
        />
        {/* Checkered flag corners */}
        {[0, 1].map((corner) => (
          <div
            key={`corner-${corner}`}
            style={{
              position: 'absolute',
              [corner === 0 ? 'top' : 'bottom']: 0,
              right: 0,
              width: '25%',
              height: '15%',
              opacity: 0.08,
              background: `repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%) 0 0 / 20px 20px`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let scaleX = 1

    if (phase === 'enter') {
      // Streak in from the left with motion blur effect
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = Math.min(1, enterProgress * 3)
      translateX = (1 - eased) * -(width * 0.6)
      scaleX = 1 + (1 - eased) * 0.3
    } else if (phase === 'hold') {
      opacity = 1
      translateX = Math.sin(Date.now() * 0.002) * 3
    } else {
      // Streak out to the right
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateX = eased * (width * 0.6)
      scaleX = 1 + eased * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) scaleX(${scaleX})`,
          opacity,
        }}
      >
        {/* Streak trail lines */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${30 + i * 20}%`,
                  right: '100%',
                  width: `${150 - enterProgress * 180}px`,
                  height: 3,
                  background: `linear-gradient(90deg, transparent, ${color}${Math.round((1 - enterProgress) * 80).toString(16).padStart(2, '0')})`,
                  marginRight: 8,
                }}
              />
            ))}
          </>
        )}
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 140px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            textShadow: `4px 0 0 ${color}40, -2px 0 0 ${color}20, 0 2px 10px rgba(0,0,0,0.5)`,
          }}
        >
          {word}
        </div>
        {/* Racing stripe under text */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '5%',
            right: '5%',
            height: 4,
            background: `linear-gradient(90deg, ${color}, ${color}60)`,
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function RacingStripeComponent(props: MotionGraphicProps<RacingStripeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-racing-stripe',
  title: 'Racing Stripe',
  description: 'Words streak in from the left with racing stripe trails and motion blur. Background features scrolling speed lines and checkered corners.',
  tags: ['kinetic', 'racing', 'stripe', 'car', 'speed', 'motorsport', 'fast'],
  category: 'captions',
  component: RacingStripeComponent as any,
  defaultConfig: {
    words: ['RACE', 'FAST', 'DRIFT', 'WIN'],
    colors: ['#ff2020', '#ffffff', '#ffcc00', '#00ccff'],
    bgColor: '#0d0d18',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RACE', 'FAST', 'DRIFT', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff2020', '#ffffff', '#ffcc00', '#00ccff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
