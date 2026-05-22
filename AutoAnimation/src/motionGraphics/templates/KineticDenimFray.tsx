import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DenimFrayConfig extends KineticBaseConfig {
  frayAmount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Denim warp threads running vertically
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i + 0.5) * 5}%`,
              top: 0,
              width: 1,
              height: '100%',
              background: `rgba(255,255,255,${0.02 + (i % 3) * 0.01})`,
              transform: `skewX(${Math.sin(t * 0.3 + i * 0.4) * 0.3}deg)`,
            }}
          />
        ))}
        {/* Horizontal weft threads */}
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={`h${i}`}
            style={{
              position: 'absolute',
              top: `${(i + 0.5) / 30 * 100}%`,
              left: 0,
              height: 1,
              width: '100%',
              background: `rgba(255,255,255,${0.015 + (i % 2) * 0.01})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      const charDelay = ci / (word.length + 1)
      let opacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let blur = 0
      let brightness = 1
      let frayProgress = 0

      if (phase === 'enter') {
        // Denim stamp: letter slaps down with fabric texture press
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.4) / 0.7))
        const ep = easeOutExpo(p)

        yOff = (1 - ep) * -30
        scaleX = 0.8 + ep * 0.2 + (1 - ep) * 0.05
        scaleY = 1.3 - ep * 0.3 - (1 - ep) * 0.1
        blur = (1 - ep) * 2
        brightness = 0.7 + ep * 0.3
        opacity = p < 0.1 ? p * 10 : 1
        frayProgress = 1 - ep // start frayed, settle clean

      } else if (phase === 'hold') {
        // Denim fibers settle: subtle texture breathing
        frayProgress = 0.15 + Math.sin(t * 1.2 + ci * 0.5) * 0.05
        scaleX = 1 + Math.sin(t * 1.6 + ci * 0.3) * 0.008
        scaleY = 1 + Math.sin(t * 1.3 + ci * 0.6) * 0.006
        // Indigo dye variation shimmer
        brightness = 1 + Math.sin(t * 2 + ci * 0.8) * 0.04

      } else {
        // Fray apart: threads pull away from shape
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.8))
        const ep = easeInCubic(p)
        frayProgress = ep
        scaleX = 1 + ep * 0.4
        scaleY = 1 - ep * 0.5
        opacity = 1 - ep
        blur = ep * 5
        xOff = Math.sin(ci * 2.3) * ep * 20
        yOff = ep * 15
      }

      // Fray fibers: small displaced copies at edges
      const frayFibers = frayProgress > 0.05 ? Array.from({ length: 4 }, (_, fi) => {
        const angle = (fi / 4) * Math.PI * 2 + ci * 0.5
        const dist = frayProgress * (8 + fi * 3)
        return (
          <span
            key={`fray${fi}`}
            style={{
              position: 'absolute',
              left: Math.cos(angle) * dist,
              top: Math.sin(angle) * dist,
              color,
              opacity: frayProgress * 0.3 * (1 - fi * 0.15),
              fontSize: '0.25em',
              filter: `blur(${frayProgress * 1.5}px)`,
            }}
          >
            {ch}
          </span>
        )
      }) : null

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: [
              blur > 0 ? `blur(${blur}px)` : '',
              brightness !== 1 ? `brightness(${brightness})` : '',
            ].filter(Boolean).join(' ') || undefined,
            textShadow: `1px 1px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          {frayFibers}
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(48px, 13vw, 156px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function DenimFrayComponent(props: MotionGraphicProps<DenimFrayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-denim-fray',
  title: 'Kinetic Denim Fray',
  description: 'Letters have denim fabric texture with fraying fibers at edges that flutter and pull apart. Background shows warp/weft weave grid. Letters stamp in and unravel outward.',
  tags: ['kinetic', 'typography', 'fabric', 'denim', 'fray', 'textile', 'fibers', 'jeans', 'material-physics'],
  category: 'captions',
  component: DenimFrayComponent as any,
  defaultConfig: {
    words: ['RAW', 'WORN', 'DENIM', 'FRAY'],
    colors: ['#3D6B9E', '#2E5888', '#4A7AB0', '#355F8C'],
    bgColor: '#0E1520',
    cycleDuration: 1.6,
    frayAmount: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAW', 'WORN', 'DENIM', 'FRAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3D6B9E', '#2E5888', '#4A7AB0', '#355F8C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E1520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'frayAmount', label: 'Fray Amount', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
