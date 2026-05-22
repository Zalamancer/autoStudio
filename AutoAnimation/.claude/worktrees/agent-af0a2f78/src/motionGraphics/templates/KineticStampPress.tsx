import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StampPressConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle paper grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 15% 15%, rgba(0,0,0,0.01) 0%, transparent 3%)',
            'radial-gradient(circle at 85% 85%, rgba(0,0,0,0.008) 0%, transparent 4%)',
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.006) 0%, transparent 5%)',
          ].join(', '),
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 83 + 37
    const stampRotation = Math.sin(seed * 1.3) * 3 - 5 // slight consistent tilt

    // Ink bleed effect: multiple slightly offset copies for rough edges
    const renderStampText = (scale: number, opacity: number, extraRotation: number = 0, bleedAmount: number = 0) => (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${stampRotation + extraRotation}deg) scale(${scale})`,
          opacity,
        }}
      >
        {/* Stamp border */}
        <div
          style={{
            position: 'relative',
            border: `4px solid ${color}`,
            borderRadius: 6,
            padding: 'clamp(10px, 2.5vw, 28px) clamp(20px, 5vw, 50px)',
            opacity: 0.85 + bleedAmount * 0.15,
          }}
        >
          {/* Ink bleed layers */}
          {bleedAmount > 0 && Array.from({ length: 3 }, (_, bi) => (
            <div
              key={bi}
              style={{
                position: 'absolute',
                inset: -2 - bi * bleedAmount * 2,
                border: `1px solid ${color}`,
                borderRadius: 6 + bi * 2,
                opacity: 0.1 - bi * 0.03,
              }}
            />
          ))}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(36px, 9vw, 120px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              letterSpacing: 6,
              textTransform: 'uppercase',
              // Ink texture: slight unevenness
              textShadow: bleedAmount > 0
                ? `${bleedAmount}px 0 0 ${color}, -${bleedAmount * 0.5}px 0 0 ${color}`
                : undefined,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )

    if (phase === 'enter') {
      // Stamp slams down: scale from 120% to 100% with rotation snap
      const slamProgress = Math.min(1, enterProgress * 1.5) // faster than full duration
      const easeOut = 1 - Math.pow(1 - slamProgress, 4)
      const scale = 1.25 - easeOut * 0.25
      const extraRotation = (1 - easeOut) * 8
      const opacity = Math.min(1, enterProgress * 3)
      // Shake on impact
      const shakeX = slamProgress > 0.6 ? Math.sin((slamProgress - 0.6) * 50) * 3 * (1 - slamProgress) : 0
      const shakeY = slamProgress > 0.6 ? Math.cos((slamProgress - 0.6) * 40) * 2 * (1 - slamProgress) : 0

      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${shakeX}px, ${shakeY}px)`,
          }}
        >
          {renderStampText(scale, opacity, extraRotation, 0)}
        </div>
      )
    }

    if (phase === 'hold') {
      // Subtle ink spread effect
      const bleed = Math.sin(holdProgress * Math.PI + seed) * 1.5 + 1

      return renderStampText(1, 1, 0, bleed)
    }

    // Exit: fades like old ink
    const opacity = 1 - exitProgress
    const desaturation = exitProgress * 50

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: desaturation > 0 ? `saturate(${100 - desaturation}%) brightness(${100 + exitProgress * 30}%)` : undefined,
        }}
      >
        {renderStampText(1, opacity, 0, 1)}
      </div>
    )
  },
}

function StampPressComponent(props: MotionGraphicProps<StampPressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stamp-press',
  title: 'Kinetic Stamp Press',
  description: 'Rubber stamp effect with slam-down entry, ink bleed at edges, and fading old ink exit',
  tags: ['kinetic', 'typography', 'stamp', 'rubber', 'ink', 'press', 'organic', 'official'],
  category: 'captions',
  component: StampPressComponent as any,
  defaultConfig: {
    words: ['APPROVED', 'DENIED', 'URGENT', 'FINAL'],
    colors: ['#C0392B', '#C0392B', '#E74C3C', '#B71C1C'],
    bgColor: '#FEFEFE',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['APPROVED', 'DENIED', 'URGENT', 'FINAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0392B', '#C0392B', '#E74C3C', '#B71C1C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FEFEFE', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
