import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DoubleExposureConfig extends KineticBaseConfig {
  layerOffset: number
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInBack(t: number): number {
  const c = 1.70158
  return (c + 1) * t * t * t - c * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Two slowly drifting organic shapes that create the "second exposure"
    const drift1X = 50 + Math.sin(t * 0.4) * 20
    const drift1Y = 50 + Math.cos(t * 0.35) * 15
    const drift2X = 50 - Math.sin(t * 0.3 + 1) * 25
    const drift2Y = 50 - Math.cos(t * 0.45 + 2) * 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* First exposure layer — warm tones */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 50% at ${drift1X}% ${drift1Y}%, rgba(180,80,40,0.25), transparent 70%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* Second exposure layer — cool tones */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 55% 45% at ${drift2X}% ${drift2Y}%, rgba(40,80,180,0.25), transparent 70%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* Film grain texture via repeating noise pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-conic-gradient(rgba(255,255,255,${0.02 + Math.sin(t * 8) * 0.01}) 0% 25%, transparent 0% 50%)`,
            backgroundSize: '4px 4px',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')
    const offset = 8

    // Build per-character transforms for both layers
    const layer1Chars = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let blur = 0

      if (phase === 'enter') {
        const delay = (ci / (chars.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutExpo(p)
        charOpacity = ep
        yOff = (1 - ep) * -30
        blur = (1 - ep) * 3
      } else if (phase === 'hold') {
        // Subtle breathing per character
        yOff = Math.sin(t * 1.5 + ci * 0.7) * 2
      } else {
        // Diverging drift — layer 1 chars float upward and apart
        const delay = (ci / (chars.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInBack(p)
        charOpacity = 1 - ep
        yOff = ep * -40
        blur = ep * 4
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
            color,
          }}
        >
          {ch}
        </span>
      )
    })

    // Second offset layer — shifted, different blend, reverse char order animation
    const layer2Chars = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0

      if (phase === 'enter') {
        const delay = ((chars.length - 1 - ci) / (chars.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        charOpacity = easeOutExpo(p) * 0.7
        yOff = (1 - easeOutExpo(p)) * 25
      } else if (phase === 'hold') {
        charOpacity = 0.6 + Math.sin(t * 1.8 + ci * 0.5) * 0.1
        yOff = Math.cos(t * 1.3 + ci * 0.9) * 2.5
      } else {
        // Diverging drift — layer 2 chars float downward
        const delay = ((chars.length - 1 - ci) / (chars.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        charOpacity = (1 - easeInBack(p)) * 0.7
        yOff = easeInBack(p) * 35
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            color,
          }}
        >
          {ch}
        </span>
      )
    })

    const sharedFont: React.CSSProperties = {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: 'clamp(40px, 12vw, 160px)',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Layer 1 — main text with screen blend */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...sharedFont,
            mixBlendMode: 'screen',
          }}
        >
          {layer1Chars}
        </div>
        {/* Layer 2 — offset ghost with multiply blend */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${offset}px), calc(-50% + ${offset}px))`,
            ...sharedFont,
            mixBlendMode: 'multiply',
            filter: 'blur(1px)',
          }}
        >
          {layer2Chars}
        </div>
      </div>
    )
  },
}

function DoubleExposureComponent(props: MotionGraphicProps<DoubleExposureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-double-exposure',
  title: 'Kinetic Double Exposure',
  description:
    'Two offset text layers with screen and multiply blend modes create a photographic double-exposure effect. Warm and cool gradients drift beneath film-grain texture.',
  tags: ['kinetic', 'typography', 'blend', 'double-exposure', 'film', 'screen', 'multiply', 'layered'],
  category: 'captions',
  component: DoubleExposureComponent as any,
  defaultConfig: {
    words: ['DOUBLE', 'EXPOSED', 'LAYERS', 'FILM'],
    colors: ['#F2E9D8', '#E8D5C0', '#D4C4B0', '#F0E0CC'],
    bgColor: '#0A0A12',
    cycleDuration: 1.2,
    layerOffset: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DOUBLE', 'EXPOSED', 'LAYERS', 'FILM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F2E9D8', '#E8D5C0', '#D4C4B0', '#F0E0CC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'layerOffset', label: 'Layer Offset (px)', type: 'number', defaultValue: 8, min: 0, max: 30, group: 'Animation' },
  ],
})
