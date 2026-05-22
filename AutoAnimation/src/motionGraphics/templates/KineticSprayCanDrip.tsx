import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SprayCanDripConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
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

    // Brick/concrete wall texture
    const brickRows = Array.from({ length: 8 }, (_, row) => {
      const yBase = row * (height / 8)
      const offset = row % 2 === 0 ? 0 : width * 0.12
      const bricks = Array.from({ length: 5 }, (_, col) => {
        const xBase = col * (width / 4.5) + offset - width * 0.06
        const brickW = width / 4.5 - 4
        const shade = 0.03 + rand(row * 17 + col * 7) * 0.03
        return (
          <div
            key={`scd-${row}-${col}`}
            style={{
              position: 'absolute',
              left: xBase,
              top: yBase + 2,
              width: brickW,
              height: height / 8 - 4,
              background: `rgba(255,255,255,${shade})`,
              borderRadius: 1,
            }}
          />
        )
      })
      return bricks
    })

    // Old spray paint tags in background (faded)
    const tags = Array.from({ length: 3 }, (_, i) => {
      const x = width * (0.1 + rand(i * 41) * 0.7)
      const y = height * (0.15 + rand(i * 29) * 0.6)
      const hue = rand(i * 53) * 360
      return (
        <div
          key={`tag${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 80 + rand(i * 37) * 100,
            height: 30 + rand(i * 19) * 40,
            borderRadius: '30%',
            background: `radial-gradient(ellipse, hsla(${hue}, 60%, 50%, 0.06), transparent 70%)`,
            filter: 'blur(8px)',
            transform: `rotate(${(rand(i * 61) - 0.5) * 30}deg)`,
          }}
        />
      )
    })

    // Spray overspray mist drifting
    const mist = Array.from({ length: 4 }, (_, i) => {
      const x = width * (0.2 + rand(i * 43 + 1) * 0.6) + Math.sin(t * 0.3 + i) * 20
      const y = height * (0.3 + rand(i * 31 + 5) * 0.4)
      return (
        <div
          key={`mist${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 120 + rand(i * 23) * 80,
            height: 60 + rand(i * 47) * 40,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(200,200,220,${0.02 + Math.sin(t * 0.5 + i) * 0.01}), transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {brickRows}
        {tags}
        {mist}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let blur = 0
      let scaleX = 1
      let scaleY = 1
      let spraySpread = 0

      if (phase === 'enter') {
        // Spray can: quick blast from left to right with cap-rattle shake
        const delay = (ci / (word.length + 1)) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeOutQuint(p)

        charOpacity = Math.min(1, ep * 2)
        // Spray builds up from fuzzy to sharp
        blur = (1 - ep) * 6
        spraySpread = (1 - ep) * 12
        // Cap rattle shake
        const shake = (1 - ep) * Math.sin(enterProgress * 80 + ci * 3) * 4
        yOff = shake
        scaleX = 0.8 + ep * 0.2
      } else if (phase === 'hold') {
        // Subtle drip progression
        yOff = Math.sin(t * 0.6 + ci * 0.4) * 1.5
      } else {
        // Fade like paint weathering
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep * 0.9
        blur = ep * 4
        scaleX = 1 - ep * 0.2
        scaleY = 1 + ep * 0.1
        yOff = ep * 10
      }

      // Drips running downward from each letter
      const dripCount = 2 + Math.floor(rand(ci * 13 + index * 7) * 3)
      const drips: React.ReactNode[] = []
      for (let d = 0; d < dripCount; d++) {
        const dripX = (rand(ci * 31 + d * 17 + index) - 0.5) * 30
        const dripMaxH = 20 + rand(ci * 19 + d * 23) * 50
        let dripH = 0
        if (phase === 'enter') {
          const dripStart = 0.4 + rand(d * 41 + ci) * 0.3
          const dp = Math.max(0, Math.min(1, (enterProgress - dripStart) / 0.5))
          dripH = easeOutQuint(dp) * dripMaxH
        } else if (phase === 'hold') {
          dripH = dripMaxH * (0.8 + Math.sin(t * 0.3 + d + ci) * 0.2)
        } else {
          dripH = dripMaxH * (1 - exitProgress * 0.3)
        }

        if (dripH > 2) {
          drips.push(
            <span
              key={`drip${d}`}
              style={{
                position: 'absolute',
                bottom: -dripH,
                left: `calc(50% + ${dripX}px)`,
                width: 3 + rand(d * 7 + ci) * 3,
                height: dripH,
                background: `linear-gradient(180deg, ${color}, ${color}60, ${color}20)`,
                borderRadius: '0 0 3px 3px',
                opacity: charOpacity * 0.8,
              }}
            />,
          )
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow:
              spraySpread > 0
                ? `0 0 ${spraySpread}px ${color}80, 0 0 ${spraySpread * 2}px ${color}30`
                : `0 0 4px ${color}40`,
          }}
        >
          {ch}
          {drips}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 14vw, 165px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function SprayCanDripComponent(props: MotionGraphicProps<SprayCanDripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spray-can-drip',
  title: 'Kinetic Spray Can Drip',
  description:
    'Street art spray paint with running drips. Text is sprayed on with cap-rattle shake, paint drips run downward from each letter, on a brick wall background.',
  tags: ['kinetic', 'typography', 'paint', 'spray', 'graffiti', 'drip', 'street', 'urban'],
  category: 'captions',
  component: SprayCanDripComponent as any,
  defaultConfig: {
    words: ['SPRAY', 'DRIP', 'WALL', 'BOMB'],
    colors: ['#FF3366', '#00E5FF', '#FFD600', '#76FF03'],
    bgColor: '#1A1A1F',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPRAY', 'DRIP', 'WALL', 'BOMB'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3366', '#00E5FF', '#FFD600', '#76FF03'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A1F', group: 'Style' },
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
