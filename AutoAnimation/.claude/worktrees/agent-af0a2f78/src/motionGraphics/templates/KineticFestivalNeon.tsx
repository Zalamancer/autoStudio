import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FestivalNeonConfig extends KineticBaseConfig {
  neonColor: string
  neonColor2: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Neon border frame with pulsing glow
    const pulseA = 0.6 + 0.4 * Math.sin(time * 3)
    const pulseB = 0.6 + 0.4 * Math.sin(time * 3 + Math.PI * 0.5)

    // Floating neon shapes
    const shapes = Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2 + time * 0.3
      const radius = Math.min(width, height) * (0.25 + 0.08 * Math.sin(time * 0.8 + i))
      const cx = width * 0.5 + Math.cos(angle) * radius
      const cy = height * 0.5 + Math.sin(angle) * radius
      const shapeSize = 20 + 15 * Math.sin(time + i * 1.2)
      const hue = (i * 45 + time * 30) % 360
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: shapeSize,
            height: shapeSize,
            borderRadius: i % 2 === 0 ? '50%' : '3px',
            border: `2px solid hsl(${hue}, 100%, 65%)`,
            transform: `translate(-50%, -50%) rotate(${time * 30 + i * 45}deg)`,
            opacity: 0.3 + 0.2 * Math.sin(time * 2 + i),
            boxShadow: `0 0 12px hsl(${hue}, 100%, 55%), inset 0 0 6px hsl(${hue}, 100%, 55%)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark gradient base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(30,0,60,0.3) 0%, transparent 70%)`,
          }}
        />

        {/* Floating neon shapes */}
        {shapes}

        {/* Neon border frame */}
        <div
          style={{
            position: 'absolute',
            inset: '6%',
            border: `2px solid rgba(255, 0, 200, ${pulseA * 0.5})`,
            borderRadius: 12,
            boxShadow: `0 0 20px rgba(255, 0, 200, ${pulseA * 0.3}), inset 0 0 20px rgba(255, 0, 200, ${pulseA * 0.1})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '8%',
            border: `1px solid rgba(0, 200, 255, ${pulseB * 0.4})`,
            borderRadius: 8,
            boxShadow: `0 0 15px rgba(0, 200, 255, ${pulseB * 0.2})`,
          }}
        />

        {/* Corner stars */}
        {['8%,8%', '8%,auto', 'auto,8%', 'auto,auto'].map((pos, i) => {
          const [top, left] = pos.split(',')
          const starPulse = 0.5 + 0.5 * Math.sin(time * 4 + i * 1.5)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: top === 'auto' ? 'auto' : top,
                left: left === 'auto' ? 'auto' : left,
                bottom: top === 'auto' ? '8%' : 'auto',
                right: left === 'auto' ? '8%' : 'auto',
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                color: `rgba(255, 200, 0, ${starPulse})`,
                textShadow: `0 0 10px rgba(255, 200, 0, ${starPulse * 0.6})`,
              }}
            >
              {'\u2605'}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Neon flicker on
      const flickerSteps = [0.1, 0.2, 0.35, 0.5, 0.7, 1]
      const flickerValues = [0.8, 0.2, 0.9, 0.3, 0.7, 1]
      let flickerOpacity = 0
      for (let i = 0; i < flickerSteps.length; i++) {
        if (enterProgress <= flickerSteps[i]) {
          flickerOpacity = flickerValues[i]
          break
        }
      }
      opacity = enterProgress > 0.7 ? 1 : flickerOpacity
      scale = 0.95 + 0.05 * easeOutCubic(enterProgress)
      blur = enterProgress < 0.5 ? (1 - enterProgress * 2) * 3 : 0
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 + 0.1 * exitProgress
      blur = exitProgress * 4
    }

    // Neon glow pulse during hold
    const glowIntensity = phase === 'hold' ? 0.7 + 0.3 * Math.sin(time * 4) : 0.7

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(36px, 9vw, 120px)',
          fontWeight: 900,
          color: '#fff',
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textShadow: `
            0 0 7px ${color},
            0 0 20px ${color}${Math.round(glowIntensity * 200).toString(16).padStart(2, '0')},
            0 0 42px ${color}${Math.round(glowIntensity * 140).toString(16).padStart(2, '0')},
            0 0 82px ${color}${Math.round(glowIntensity * 80).toString(16).padStart(2, '0')}
          `,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function FestivalNeonComponent(props: MotionGraphicProps<FestivalNeonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-festival-neon',
  title: 'Kinetic Festival Neon',
  description:
    'Festival poster neon text glow with floating neon shapes, pulsing border frame, and flickering sign-on effect. Electric nightlife aesthetic.',
  tags: ['kinetic', 'music', 'festival', 'neon', 'glow', 'nightlife', 'poster', 'electric'],
  category: 'captions',
  component: FestivalNeonComponent as any,
  defaultConfig: {
    words: ['FEST', 'VIBES', 'ONLY'],
    colors: ['#FF00CC', '#00FFFF', '#FFFF00'],
    bgColor: '#060012',
    cycleDuration: 1.3,
    neonColor: '#FF00CC',
    neonColor2: '#00FFFF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FEST', 'VIBES', 'ONLY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF00CC', '#00FFFF', '#FFFF00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060012', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
