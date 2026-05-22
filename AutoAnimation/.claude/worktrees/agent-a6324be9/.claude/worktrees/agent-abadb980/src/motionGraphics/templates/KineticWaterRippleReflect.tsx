import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterRippleReflectConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Water ripple reflection: text reflected in water — ripples disturb the reflection
const RIPPLE_COUNT = 5

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Water surface gradient + horizontal ripple lines
    const ripples: React.ReactNode[] = []
    for (let i = 0; i < 8; i++) {
      const y = 55 + i * 5 + Math.sin(time * 1.2 + i * 0.8) * 1.5
      ripples.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(80,160,220,${0.06 + Math.sin(time * 2 + i) * 0.03}), transparent)`,
          }}
        />,
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {ripples}
        {/* Water line */}
        <div
          style={{
            position: 'absolute',
            top: '53%',
            left: 0,
            right: 0,
            height: 1.5,
            background: 'rgba(100,180,240,0.15)',
          }}
        />
        {/* Water surface tint */}
        <div
          style={{
            position: 'absolute',
            top: '53%',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(20,60,100,0.3)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Entry: text and reflection both rise into position
    const riseY = phase === 'enter' ? (1 - backEased) * 30 : 0
    const exitY = phase === 'exit' ? -exitProgress * 40 : 0

    // Ripple distortion on reflection — strongest at entry, gentle on hold
    const rippleStrength =
      phase === 'enter'
        ? (1 - eased) * 18 + 3
        : phase === 'hold'
          ? 3 + Math.sin(time * 1.8) * 1.5
          : 3 + exitProgress * 20

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? 1 - exitProgress : 1

    // Reflection: flipped vertically, positioned below water line, with ripple skew
    const reflSkew = Math.sin(time * 2.8) * rippleStrength * 0.25
    const reflScaleX = 1 + Math.sin(time * 2.1) * rippleStrength * 0.008
    const reflBlur = rippleStrength * 0.4

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Primary text — above water */}
        <div
          style={{
            position: 'absolute',
            top: `calc(40% + ${riseY + exitY}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textShadow: `0 2px 8px rgba(0,0,0,0.4)`,
          }}
        >
          {word}
        </div>

        {/* Reflection — below water line, flipped, distorted */}
        <div
          style={{
            position: 'absolute',
            top: `calc(56% + ${-riseY + exitY}px)`,
            left: '50%',
            transform: `translateX(-50%) scaleY(-1) scaleX(${reflScaleX}) skewX(${reflSkew}deg)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: 0.4,
            filter: `blur(${reflBlur}px)`,
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 80%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 80%)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function WaterRippleReflectComponent(props: MotionGraphicProps<WaterRippleReflectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-water-ripple-reflect',
  title: 'Kinetic Water Ripple Reflect',
  description:
    'Text and its water reflection — the upright word is crisp above the waterline while the rippled reflection below undulates with continuous wave distortion',
  tags: ['kinetic', 'typography', 'water', 'ripple', 'reflection', 'mirror', 'wave', 'optical'],
  category: 'captions',
  component: WaterRippleReflectComponent as any,
  defaultConfig: {
    words: ['REFLECT', 'STILL', 'RIPPLE', 'LAKE'],
    colors: ['#D0F0FF', '#A8E0FF', '#E8F8FF', '#88C8EE'],
    bgColor: '#020810',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REFLECT', 'STILL', 'RIPPLE', 'LAKE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D0F0FF', '#A8E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020810', group: 'Style' },
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
