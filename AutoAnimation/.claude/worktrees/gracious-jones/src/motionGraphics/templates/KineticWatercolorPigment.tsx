import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WatercolorPigmentConfig extends KineticBaseConfig {}

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
    const time = frame / fps

    // Floating watercolor blotches that drift slowly
    const blotches = Array.from({ length: 7 }, (_, i) => {
      const bx = width * (0.1 + rand(i * 37 + 5) * 0.8)
      const by = height * (0.1 + rand(i * 53 + 11) * 0.8)
      const size = 60 + rand(i * 41) * 140
      const hue = [210, 340, 45, 170, 280, 25, 190][i]
      const drift = Math.sin(time * 0.15 + i * 1.2) * 12
      const driftY = Math.cos(time * 0.12 + i * 0.9) * 8
      // Organic shape via border-radius
      const phase = time * 0.2 + i * 0.5
      const br = `${42 + Math.sin(phase) * 12}% ${58 - Math.sin(phase * 1.3) * 10}% ${48 + Math.cos(phase * 0.8) * 14}% ${52 - Math.cos(phase * 1.1) * 8}%`

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: bx + drift - size / 2,
            top: by + driftY - size / 2,
            width: size,
            height: size * (0.6 + rand(i * 19) * 0.6),
            borderRadius: br,
            background: `radial-gradient(ellipse at 45% 40%, hsla(${hue}, 55%, 65%, 0.12), hsla(${hue}, 45%, 55%, 0.05) 60%, transparent)`,
            mixBlendMode: 'multiply' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(160,140,110,0.03) 2px, rgba(160,140,110,0.03) 3px),
              repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(140,120,100,0.02) 3px, rgba(140,120,100,0.02) 4px)
            `,
            mixBlendMode: 'multiply' as const,
          }}
        />
        {/* Cold-press paper texture bumps */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 40%, rgba(0,0,0,0.015), transparent 40%), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.01), transparent 35%)',
          }}
        />
        {blotches}
        {/* Water stain ring */}
        <div
          style={{
            position: 'absolute',
            right: '8%',
            bottom: '10%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '2px solid rgba(160,140,100,0.06)',
            opacity: 0.5 + Math.sin(time * 0.3) * 0.1,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let bleedSpread = 0
      let yOff = 0
      let saturation = 1
      let blurAmount = 0

      if (phase === 'enter') {
        // Wet pigment spreading: each char blooms from a wet spot
        const delay = (ci / (word.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        // Start as a blurry wet blob, sharpen as pigment settles
        blurAmount = (1 - ep) * 8
        bleedSpread = ep * 20
        charOpacity = Math.min(1, ep * 1.8)
        saturation = 0.4 + ep * 0.6
        // Pigment pools downward slightly as it bleeds
        yOff = (1 - ep) * 6
      } else if (phase === 'hold') {
        // Pigment still wet -- subtle bleed expansion and color breathing
        const wt = t * 0.8 + ci * 0.4
        bleedSpread = 20 + Math.sin(wt) * 3
        yOff = Math.sin(wt * 1.3) * 1.5
        // Pigment granulation shimmer
        saturation = 0.9 + Math.sin(t * 1.5 + ci * 0.7) * 0.1
      } else {
        // Water washes pigment away -- dissolves and bleeds outward
        const delay = ((word.length - 1 - ci) / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        blurAmount = ep * 12
        bleedSpread = 20 + ep * 15
        charOpacity = 1 - ep
        saturation = 1 - ep * 0.5
        yOff = ep * 8
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            filter: blurAmount > 0.5 ? `blur(${blurAmount}px) saturate(${saturation})` : `saturate(${saturation})`,
            textShadow: `
              0 0 ${bleedSpread * 0.4}px ${color}50,
              ${bleedSpread * 0.15}px ${bleedSpread * 0.1}px ${bleedSpread * 0.6}px ${color}30,
              ${-bleedSpread * 0.1}px ${bleedSpread * 0.2}px ${bleedSpread * 0.5}px ${color}25
            `,
            mixBlendMode: 'multiply' as const,
          }}
        >
          {ch}
          {/* Pigment granulation dots on each character */}
          {charOpacity > 0.5 && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `radial-gradient(circle, ${color}15 1px, transparent 1px)`,
                backgroundSize: '4px 4px',
                backgroundPosition: `${ci * 2}px ${ci}px`,
                mixBlendMode: 'multiply' as const,
                pointerEvents: 'none',
              }}
            />
          )}
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
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 400,
            fontStyle: 'italic',
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

function WatercolorPigmentComponent(props: MotionGraphicProps<WatercolorPigmentConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-watercolor-pigment',
  title: 'Kinetic Watercolor Pigment',
  description:
    'Wet watercolor pigment blooms per-character with granulation texture, bleed spread, and paper grain. Text dissolves outward like pigment washed away by water.',
  tags: ['kinetic', 'typography', 'watercolor', 'pigment', 'bleed', 'organic', 'handmade', 'warm'],
  category: 'captions',
  component: WatercolorPigmentComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'WASH', 'TINT', 'FLOW'],
    colors: ['#2E86AB', '#C1666B', '#48A9A6', '#D4B483'],
    bgColor: '#F7F3EB',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOM', 'WASH', 'TINT', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2E86AB', '#C1666B', '#48A9A6', '#D4B483'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F7F3EB', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
