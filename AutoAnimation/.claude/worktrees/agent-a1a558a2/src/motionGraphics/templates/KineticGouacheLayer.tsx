import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GouacheLayerConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const FLAT_PALETTE = ['#E85D75', '#4A90D9', '#F2C94C', '#27AE60', '#9B59B6', '#E67E22', '#1ABC9C', '#C0392B']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Flat geometric gouache shapes: designer illustration style
    const shapes = Array.from({ length: 7 }, (_, i) => {
      const x = width * rand(i * 41 + 3)
      const y = height * rand(i * 53 + 7)
      const size = 40 + rand(i * 23) * 80
      const colorIdx = i % FLAT_PALETTE.length
      const isCircle = rand(i * 67) > 0.5
      const rotation = rand(i * 31) * 45

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - size / 2,
            top: y - size / 2,
            width: size,
            height: isCircle ? size : size * 0.7,
            borderRadius: isCircle ? '50%' : '4px',
            background: FLAT_PALETTE[colorIdx],
            opacity: 0.08 + Math.sin(t * 0.3 + i * 0.9) * 0.02,
            transform: `rotate(${rotation}deg)`,
          }}
        />
      )
    })

    // Illustration board edge grain
    const grainLines = Array.from({ length: 10 }, (_, i) => (
      <div
        key={`g${i}`}
        style={{
          position: 'absolute',
          left: 0,
          top: height * (i / 10) + rand(i * 19) * 8,
          width: '100%',
          height: 1,
          background: `rgba(255,255,255,${0.01 + rand(i * 47) * 0.015})`,
        }}
      />
    ))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {grainLines}
        {shapes}
        {/* Matte finish: no glossy reflections, just flat tone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.05) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let scaleX = 1
      let scaleY = 1

      if (phase === 'enter') {
        // Crisp stamp-down: letters snap into place with slight overshoot
        const delay = (ci / (word.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutBack(p)

        charOpacity = Math.min(1, p * 2.5)
        scaleX = ep
        scaleY = ep
        // Drop from above with snap
        yOff = -(1 - Math.min(1, ep)) * 30
      } else if (phase === 'hold') {
        // Bold flat color: virtually no motion, designer precision
        yOff = Math.sin(t * 0.5 + ci * 0.4) * 0.8
      } else {
        // Peel off like a sticker: rotate and lift
        const delay = ((word.length - 1 - ci) / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep
        yOff = -ep * 25
        xOff = ep * 15 * (ci % 2 === 0 ? 1 : -1)
        scaleX = 1 - ep * 0.3
        scaleY = 1 - ep * 0.2
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            // Flat opaque matte: no glow, no gradient, crisp edges
            textShadow: 'none',
            WebkitTextStroke: `0.5px ${color}`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Flat color block behind text for emphasis
    let colorBlock: React.ReactNode = null
    if (phase !== 'exit') {
      const blockOpacity = phase === 'enter' ? easeOutBack(enterProgress) * 0.12 : 0.12
      colorBlock = (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '75%',
            height: '35%',
            transform: 'translate(-50%, -50%)',
            borderRadius: 6,
            background: color,
            opacity: blockOpacity,
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {colorBlock}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Futura', 'Trebuchet MS', 'Arial', sans-serif",
            fontSize: 'clamp(46px, 13vw, 160px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function GouacheLayerComponent(props: MotionGraphicProps<GouacheLayerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gouache-layer',
  title: 'Kinetic Gouache Layer',
  description:
    'Flat opaque gouache/tempera paint with crisp edges and bold matte color. Letters stamp down with designer precision on illustration board, no gloss or gradient.',
  tags: ['kinetic', 'typography', 'paint', 'gouache', 'tempera', 'flat', 'matte', 'illustration'],
  category: 'captions',
  component: GouacheLayerComponent as any,
  defaultConfig: {
    words: ['BOLD', 'FLAT', 'MATTE', 'CRISP'],
    colors: ['#E85D75', '#4A90D9', '#F2C94C', '#27AE60'],
    bgColor: '#F7F4EF',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BOLD', 'FLAT', 'MATTE', 'CRISP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E85D75', '#4A90D9', '#F2C94C', '#27AE60'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F7F4EF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
