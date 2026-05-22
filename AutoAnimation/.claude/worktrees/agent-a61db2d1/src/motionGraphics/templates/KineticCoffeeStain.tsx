import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CoffeeStainConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Coffee ring stains as decorative background elements
    const stains = [
      { x: 15, y: 20, size: 80, opacity: 0.06, rotation: 0 },
      { x: 78, y: 65, size: 60, opacity: 0.05, rotation: 15 },
      { x: 45, y: 85, size: 50, opacity: 0.04, rotation: -10 },
      { x: 85, y: 15, size: 45, opacity: 0.04, rotation: 5 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#FFF8F0'
            ? 'linear-gradient(145deg, #FFF8F0 0%, #F5E6D0 50%, #FFF2E5 100%)'
            : bgColor,
        }}
      >
        {/* Paper grain lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${12 + i * 11}%`,
              height: 1,
              background: 'rgba(160,120,80,0.04)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Coffee ring stains */}
        {stains.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              border: `3px solid rgba(101,67,33,${s.opacity})`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
              background: `radial-gradient(circle, rgba(101,67,33,${s.opacity * 0.3}) 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Steam from cup in corner */}
        {Array.from({ length: 3 }, (_, i) => {
          const baseY = 70 - ((time * 6 + i * 5) % 30)
          const sway = Math.sin(time * 2 + i * 1.2) * 5
          return (
            <div
              key={`steam-${i}`}
              style={{
                position: 'absolute',
                right: `calc(12% + ${sway}px)`,
                top: `${baseY}%`,
                width: 12 + i * 4,
                height: 18 + i * 4,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(139,90,43,0.04), transparent)`,
                filter: 'blur(4px)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let stainOpacity = 0

    if (phase === 'enter') {
      // Coffee drip reveal: stain appears first, text emerges from it
      if (enterProgress < 0.3) {
        stainOpacity = enterProgress / 0.3
        opacity = 0
      } else if (enterProgress < 0.5) {
        stainOpacity = 1
        opacity = (enterProgress - 0.3) / 0.2
        scale = 0.9 + ((enterProgress - 0.3) / 0.2) * 0.1
      } else {
        stainOpacity = 1 - (enterProgress - 0.5) / 0.5 * 0.4
        opacity = 1
        scale = 1
      }
    } else if (phase === 'hold') {
      opacity = 1
      stainOpacity = 0.6 + Math.sin(f * 0.04 + index) * 0.05
      // Gentle warmth pulse
      scale = 1 + Math.sin(f * 0.06 + index * 2) * 0.01
    } else {
      opacity = 1 - exitProgress
      stainOpacity = 0.6 * (1 - exitProgress)
      scale = 1 - exitProgress * 0.05
    }

    const stainSize = 'clamp(120px, 30vw, 280px)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.max(opacity, stainOpacity > 0 ? 0.001 : 0),
        }}
      >
        {/* Coffee ring stain behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: stainSize,
            height: stainSize,
            borderRadius: '50%',
            border: '6px solid rgba(101,67,33,0.15)',
            background: 'radial-gradient(circle, rgba(101,67,33,0.08) 0%, rgba(101,67,33,0.02) 40%, transparent 70%)',
            opacity: stainOpacity,
            pointerEvents: 'none',
          }}
        />
        {/* Coffee drip accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '55%',
            width: 8,
            height: 20,
            borderRadius: '0 0 4px 4px',
            background: 'rgba(101,67,33,0.1)',
            opacity: stainOpacity * 0.7,
            pointerEvents: 'none',
          }}
        />
        {/* Text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(36px, 11vw, 130px)',
            fontWeight: 700,
            color,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 2px rgba(101,67,33,0.15)',
            opacity,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CoffeeStainComponent(props: MotionGraphicProps<CoffeeStainConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-coffee-stain',
  title: 'Coffee Stain',
  description: 'Text emerges from coffee ring stain art on warm paper background with steam wisps and drip accents',
  tags: ['kinetic', 'food', 'coffee', 'cafe', 'vintage', 'warm', 'cozy', 'stain'],
  category: 'captions',
  component: CoffeeStainComponent as any,
  defaultConfig: {
    words: ['BREW', 'ROAST', 'LATTE', 'AROMA'],
    colors: ['#4A2C17', '#6B4226', '#4A2C17', '#6B4226'],
    bgColor: '#FFF8F0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREW', 'ROAST', 'LATTE', 'AROMA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A2C17', '#6B4226', '#4A2C17', '#6B4226'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
