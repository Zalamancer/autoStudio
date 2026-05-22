import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WatercolorWashConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Watercolor paper texture: buckled uneven surface
    const buckles = Array.from({ length: 5 }, (_, i) => {
      const x = width * rand(i * 43 + 1)
      const y = height * rand(i * 29 + 5)
      const size = 150 + rand(i * 37) * 200
      const alpha = 0.015 + Math.sin(t * 0.2 + i) * 0.005

      return (
        <div
          key={`b${i}`}
          style={{
            position: 'absolute',
            left: x - size / 2,
            top: y - size / 2,
            width: size,
            height: size,
            borderRadius: '30% 70% 60% 40% / 50% 30% 70% 50%',
            background: `radial-gradient(ellipse, rgba(255,255,240,${alpha}), transparent 60%)`,
            filter: 'blur(20px)',
          }}
        />
      )
    })

    // Ambient watercolor washes bleeding across paper
    const washes = Array.from({ length: 4 }, (_, i) => {
      const x = width * (0.1 + rand(i * 51 + 3) * 0.8)
      const y = height * (0.15 + rand(i * 67 + 9) * 0.7)
      const sizeW = 120 + rand(i * 23) * 200
      const sizeH = 80 + rand(i * 41) * 150
      const hue = [340, 210, 50, 150][i % 4]
      const drift = Math.sin(t * 0.15 + i * 0.9) * 8
      const bloom = Math.sin(t * 0.2 + i * 1.3) * 10

      return (
        <div
          key={`w${i}`}
          style={{
            position: 'absolute',
            left: x + drift - sizeW / 2,
            top: y - sizeH / 2,
            width: sizeW + bloom,
            height: sizeH + bloom * 0.6,
            borderRadius: '40% 60% 55% 45% / 55% 40% 60% 45%',
            background: `radial-gradient(ellipse, hsla(${hue}, 50%, 60%, 0.06), hsla(${hue}, 40%, 50%, 0.02) 60%, transparent)`,
            filter: 'blur(25px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Watercolor paper grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,240,0.008) 1px, rgba(255,255,240,0.008) 2px)',
          }}
        />
        {buckles}
        {washes}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let blur = 0
      let scaleX = 1
      let scaleY = 1
      let bloomSpread = 0

      if (phase === 'enter') {
        // Wet watercolor: pigment drops and blooms outward
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.7))
        const ep = easeOutQuart(p)

        charOpacity = Math.min(1, ep * 1.3)
        // Start as a concentrated drop, bloom outward
        scaleX = 0.4 + ep * 0.6
        scaleY = 0.4 + ep * 0.6
        // Wet edge bloom effect
        bloomSpread = (1 - ep) * 10
        blur = (1 - ep) * 4
      } else if (phase === 'hold') {
        // Pigment continues to flow subtly at edges
        const wt = t * 0.8 + ci * 0.5
        yOff = Math.sin(wt) * 2
        // Subtle bloom pulse at edges
        bloomSpread = 2 + Math.sin(t * 1.5 + ci * 0.7) * 2
      } else {
        // Watercolor lifts off: blots thin and fade
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep
        // Pigment thins and spreads as water evaporates
        scaleX = 1 + ep * 0.2
        scaleY = 1 + ep * 0.15
        blur = ep * 6
        bloomSpread = ep * 15
      }

      // Translucent watercolor layering effect
      const layerAlpha = 0.85 + Math.sin(t * 0.4 + ci * 0.6) * 0.05

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity * layerAlpha,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow:
              bloomSpread > 0
                ? `0 0 ${bloomSpread}px ${color}50, 0 0 ${bloomSpread * 2}px ${color}20, 0 2px ${bloomSpread}px ${color}15`
                : `0 0 4px ${color}25`,
            mixBlendMode: 'multiply',
          }}
        >
          {ch}
        </span>
      )
    })

    // Water bloom halo behind text
    let bloomHalo: React.ReactNode = null
    if (phase !== 'exit') {
      const haloOpacity = phase === 'enter' ? enterProgress * 0.12 : 0.12 - holdProgress * 0.02
      bloomHalo = (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '80%',
            height: '60%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '40% 60% 50% 50% / 50% 40% 60% 50%',
            background: `radial-gradient(ellipse, ${color}18, ${color}08 50%, transparent 70%)`,
            opacity: haloOpacity,
            filter: 'blur(15px)',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {bloomHalo}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(42px, 11vw, 148px)',
            fontWeight: 400,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function WatercolorWashComponent(props: MotionGraphicProps<WatercolorWashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-watercolor-wash',
  title: 'Kinetic Watercolor Wash',
  description:
    'Text painted in wet watercolor with pigment that flows and blooms at edges. Letters drop as concentrated pigment and bloom outward, with translucent layering on buckled paper.',
  tags: ['kinetic', 'typography', 'paint', 'watercolor', 'wash', 'bloom', 'pigment', 'paper'],
  category: 'captions',
  component: WatercolorWashComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'WASH', 'FLOW', 'SOFT'],
    colors: ['#E88D9A', '#7BB5D6', '#D4A853', '#8BC49E'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BLOOM', 'WASH', 'FLOW', 'SOFT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E88D9A', '#7BB5D6', '#D4A853', '#8BC49E'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
