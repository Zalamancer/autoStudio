import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HardLightPulseConfig extends KineticBaseConfig {
  pulseSpeed: number
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - t * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Neon sign backing — dark wall with ambient light
    const flickerA = 0.6 + Math.sin(t * 12) * 0.04 + Math.sin(t * 37) * 0.02
    const glowX = 50 + Math.sin(t * 0.6) * 5
    const glowY = 50 + Math.cos(t * 0.5) * 3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Wall texture — horizontal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.015) 18px, rgba(255,255,255,0.015) 19px)',
            mixBlendMode: 'hard-light',
          }}
        />
        {/* Ambient neon wash on wall */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 50% at ${glowX}% ${glowY}%, rgba(255,50,100,${flickerA * 0.12}), transparent 60%)`,
            mixBlendMode: 'hard-light',
          }}
        />
        {/* Secondary cool wash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 50% 40% at ${100 - glowX}% ${100 - glowY}%, rgba(50,100,255,${flickerA * 0.08}), transparent 60%)`,
            mixBlendMode: 'hard-light',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')

    // Neon sign flicker — rapid on/off during enter, steady with micro-flicker during hold
    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let neonGlow = 1
      let yOff = 0
      let xScale = 1

      if (phase === 'enter') {
        // Neon tubes turning on one by one with flicker
        const delay = (ci / (chars.length + 1)) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeOutBack(p)

        // Flicker effect during ignition
        const flickerPhase = p * 8
        const flicker = p < 0.7 ? (Math.sin(flickerPhase * Math.PI * 4) > 0.2 ? 1 : 0.1) : 1
        charOpacity = ep * flicker
        neonGlow = ep
        xScale = 0.3 + ep * 0.7
      } else if (phase === 'hold') {
        // Steady neon with subtle power fluctuation
        const micro = Math.sin(t * 18 + ci * 3.7) * 0.03
        const breathe = Math.sin(t * 1.6 + ci * 0.5) * 0.04
        neonGlow = 0.92 + breathe + micro
        charOpacity = 0.95 + breathe
        yOff = Math.sin(t * 1.2 + ci * 0.8) * 1
      } else {
        // Neon tubes shutting off — reverse flicker then dark
        const delay = ((chars.length - 1 - ci) / (chars.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
        const ep = easeInCirc(p)

        // Flicker before going dark
        const flickerPhase = p * 6
        const flicker = p > 0.3 && p < 0.8 ? (Math.sin(flickerPhase * Math.PI * 5) > 0 ? 1 : 0.15) : 1
        charOpacity = (1 - ep) * flicker
        neonGlow = 1 - ep
        xScale = 1 - ep * 0.5
      }

      const glowSize = 6 + neonGlow * 14
      const glowColor = color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${xScale})`,
            color,
            textShadow: neonGlow > 0.05
              ? `0 0 ${glowSize * 0.5}px ${glowColor}, 0 0 ${glowSize}px ${glowColor}, 0 0 ${glowSize * 2}px ${glowColor}88, 0 0 ${glowSize * 3}px ${glowColor}44`
              : 'none',
          }}
        >
          {/* Hard-light overlay creates neon intensity */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'inline-block',
              color: `rgba(255,255,255,${neonGlow * 0.6})`,
              mixBlendMode: 'hard-light',
              pointerEvents: 'none',
              filter: `blur(${1 + neonGlow}px)`,
            }}
          >
            {ch}
          </span>
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function HardLightPulseComponent(props: MotionGraphicProps<HardLightPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hard-light-pulse',
  title: 'Kinetic Hard Light Pulse',
  description:
    'Neon sign effect using hard-light blend mode. Tubes flicker on one by one, pulse with power fluctuations during hold, and shut off with dying flicker on exit.',
  tags: ['kinetic', 'typography', 'blend', 'hard-light', 'neon', 'sign', 'flicker', 'pulse'],
  category: 'captions',
  component: HardLightPulseComponent as any,
  defaultConfig: {
    words: ['NEON', 'PULSE', 'GLOW', 'SIGN'],
    colors: ['#FF3366', '#33CCFF', '#FF6633', '#66FF99'],
    bgColor: '#0A0A14',
    cycleDuration: 1.3,
    pulseSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEON', 'PULSE', 'GLOW', 'SIGN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#33CCFF', '#FF6633', '#66FF99'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'pulseSpeed', label: 'Pulse Speed', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
