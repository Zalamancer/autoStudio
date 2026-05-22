import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColorBurnRevealConfig extends KineticBaseConfig {
  burnColor: string
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t <= 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Animated color overlay that the text burns through
    const hueShift = t * 15
    const sweepX = 50 + Math.sin(t * 0.5) * 30
    const sweepY = 50 + Math.cos(t * 0.4) * 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Base warm layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${135 + Math.sin(t * 0.3) * 20}deg, hsla(${10 + hueShift}, 80%, 40%, 0.5), hsla(${40 + hueShift}, 70%, 35%, 0.3), transparent)`,
            mixBlendMode: 'color-burn',
          }}
        />
        {/* Sweeping hot spot */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 40% 35% at ${sweepX}% ${sweepY}%, hsla(${20 + hueShift}, 90%, 50%, 0.35), transparent 70%)`,
            mixBlendMode: 'color-burn',
          }}
        />
        {/* Ember particles — small floating dots */}
        {Array.from({ length: 8 }, (_, i) => {
          const px = (width * (0.1 + ((i * 137.5) % 100) / 125)) + Math.sin(t * 0.8 + i * 2.1) * 20
          const py = (height * (0.15 + ((i * 97.3) % 100) / 140)) + Math.cos(t * 0.6 + i * 1.7) * 15 - t * 8 % height
          const size = 2 + Math.sin(t * 3 + i) * 1.5
          const op = 0.3 + Math.sin(t * 4 + i * 1.5) * 0.2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: px,
                top: ((py % height) + height) % height,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255,${120 + i * 15},30,${op})`,
                boxShadow: `0 0 ${size * 2}px rgba(255,100,0,${op * 0.5})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')

    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let burnIntensity = 0
      let glowOpacity = 0

      if (phase === 'enter') {
        // Characters burn in from center outward
        const centerDist = Math.abs(ci - (chars.length - 1) / 2) / (chars.length / 2)
        const delay = centerDist * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutExpo(p)
        charOpacity = ep
        burnIntensity = (1 - ep) * 1.5
        glowOpacity = Math.sin(p * Math.PI) * 0.8
      } else if (phase === 'hold') {
        // Smoldering pulse — chars glow and breathe
        const pulse = Math.sin(t * 2.5 + ci * 0.8)
        burnIntensity = 0.05 + pulse * 0.05
        glowOpacity = 0.15 + pulse * 0.1
        yOff = Math.sin(t * 1.4 + ci * 0.6) * 1.5
      } else {
        // Chars burn away from edges inward
        const edgeDist = Math.min(ci, chars.length - 1 - ci) / (chars.length / 2)
        const delay = edgeDist * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.65))
        const ep = easeInExpo(p)
        charOpacity = 1 - ep
        burnIntensity = ep * 2
        glowOpacity = ep * 0.6
        yOff = ep * -20
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            color,
            textShadow: glowOpacity > 0.01
              ? `0 0 ${8 + burnIntensity * 12}px rgba(255,120,0,${glowOpacity}), 0 0 ${20 + burnIntensity * 20}px rgba(255,60,0,${glowOpacity * 0.5})`
              : 'none',
          }}
        >
          {/* Color burn overlay on each character */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'inline-block',
              color: `rgba(255,80,0,${burnIntensity * 0.4})`,
              mixBlendMode: 'color-burn',
              pointerEvents: 'none',
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
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            mixBlendMode: 'color-dodge',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function ColorBurnRevealComponent(props: MotionGraphicProps<ColorBurnRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-color-burn-reveal',
  title: 'Kinetic Color Burn Reveal',
  description:
    'Text burns through a shifting color overlay using color-burn and color-dodge blend modes. Characters ignite from center outward with ember particles and smoldering glow.',
  tags: ['kinetic', 'typography', 'blend', 'color-burn', 'fire', 'reveal', 'ember', 'glow'],
  category: 'captions',
  component: ColorBurnRevealComponent as any,
  defaultConfig: {
    words: ['IGNITE', 'BURN', 'BLAZE', 'ASH'],
    colors: ['#FFDDAA', '#FFE8C0', '#FFF0D0', '#FFEABB'],
    bgColor: '#0C0604',
    cycleDuration: 1.2,
    burnColor: '#FF6600',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IGNITE', 'BURN', 'BLAZE', 'ASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFDDAA', '#FFE8C0', '#FFF0D0', '#FFEABB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0604', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'burnColor', label: 'Burn Color', type: 'color', defaultValue: '#FF6600', group: 'Animation' },
  ],
})
