import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SunBleachConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Harsh sunlight with shifting UV beam
    const sunX = 50 + Math.sin(t * 0.15) * 20
    const sunY = 25 + Math.cos(t * 0.1) * 10
    const sunIntensity = 0.06 + Math.sin(t * 0.3) * 0.02

    // Dust motes floating in sunlight
    const dustMotes: React.ReactNode[] = []
    for (let i = 0; i < 12; i++) {
      const dx = width * ((rand(i * 31 + 5) + t * 0.02 * (0.5 + rand(i * 17) * 0.5)) % 1)
      const dy = height * ((rand(i * 47 + 13) + Math.sin(t * 0.3 + i) * 0.05) % 1)
      const size = 1.5 + rand(i * 19) * 2.5
      const alpha = 0.1 + rand(i * 29) * 0.15

      dustMotes.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dx,
            top: dy,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255, 240, 200, ${alpha})`,
            boxShadow: `0 0 ${size * 2}px rgba(255, 240, 180, ${alpha * 0.5})`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sun beam cone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${sunX}% ${sunY}%, rgba(255, 245, 200, ${sunIntensity}), transparent 50%)`,
          }}
        />
        {/* UV wash gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(255, 250, 230, 0.03) 0%, transparent 40%, rgba(200, 180, 140, 0.02) 100%)`,
          }}
        />
        {dustMotes}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let bleachAmount = 0 // 0 = vivid, 1 = fully bleached
      let charScale = 1
      let ghostOutline = 0

      if (phase === 'enter') {
        // Vibrant color appears fresh
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = ep
        charScale = 0.92 + ep * 0.08
        bleachAmount = 0
      } else if (phase === 'hold') {
        charOpacity = 1
        // UV exposure drains color progressively
        const bleachDelay = ci / (word.length + 1) * 0.15
        const bleachP = Math.max(0, Math.min(1, (holdProgress - bleachDelay) / 0.85))
        bleachAmount = easeOutQuart(bleachP) * 0.7

        // Sun shimmer
        charScale = 1 + Math.sin(t * 2 + ci * 0.7) * 0.005
      } else {
        // Final fade to ghost outline
        const delay = ci / (word.length + 1) * 0.2
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.8))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep * 0.5
        bleachAmount = 0.7 + ep * 0.3
        ghostOutline = ep
      }

      // Color desaturation: vivid color -> washed pastel -> near white
      // Parse the hex color to interpolate toward white
      const hexToRgb = (hex: string) => {
        const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
        if (!match) return { r: 200, g: 100, b: 100 }
        return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
      }
      const base = hexToRgb(color)

      // Bleach toward a very pale warm white
      const targetR = 240, targetG = 235, targetB = 225
      const currentR = Math.round(base.r + (targetR - base.r) * bleachAmount)
      const currentG = Math.round(base.g + (targetG - base.g) * bleachAmount)
      const currentB = Math.round(base.b + (targetB - base.b) * bleachAmount)

      const textColor = `rgb(${currentR}, ${currentG}, ${currentB})`

      // Ghost outline: when fully bleached, only a faint outline remains
      const outlineAlpha = ghostOutline * 0.3
      const outlineColor = `rgba(${Math.round(base.r * 0.7)}, ${Math.round(base.g * 0.7)}, ${Math.round(base.b * 0.7)}, ${outlineAlpha})`

      // UV glow during bleaching
      const uvGlow = bleachAmount > 0.1 && bleachAmount < 0.8
        ? `0 0 ${bleachAmount * 15}px rgba(255, 250, 220, ${bleachAmount * 0.15})`
        : ''

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: textColor,
            opacity: charOpacity,
            transform: `scale(${charScale})`,
            WebkitTextStroke: ghostOutline > 0.2 ? `1.5px ${outlineColor}` : undefined,
            textShadow: [
              uvGlow,
              bleachAmount > 0.5 ? `0 0 2px rgba(255, 250, 240, ${(bleachAmount - 0.5) * 0.3})` : '',
            ].filter(Boolean).join(', ') || undefined,
            filter: bleachAmount > 0.6 ? `saturate(${Math.max(0, 1 - (bleachAmount - 0.6) * 2.5)})` : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    // Subtle heat shimmer lines during hold
    const shimmerLines: React.ReactNode[] = []
    if (phase === 'hold') {
      for (let s = 0; s < 3; s++) {
        const sy = (rand(s * 37 + index) - 0.5) * 40
        const sAlpha = 0.04 + Math.sin(t * 1.5 + s * 2) * 0.02
        shimmerLines.push(
          <div
            key={`sh${s}`}
            style={{
              position: 'absolute',
              top: `calc(50% + ${sy}px)`,
              left: '20%',
              width: '60%',
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(255, 250, 230, ${sAlpha}), transparent)`,
              transform: `translateY(${Math.sin(t * 2 + s * 1.5) * 3}px)`,
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {shimmerLines}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function SunBleachComponent(props: MotionGraphicProps<SunBleachConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sun-bleach',
  title: 'Kinetic Sun Bleach',
  description: 'Text fades from vibrant color to washed out as if years of UV exposure. Color drains progressively during hold, ghost outline remains on exit. Dust motes float in harsh sunlight.',
  tags: ['kinetic', 'typography', 'decay', 'sun', 'bleach', 'fade', 'uv', 'washed'],
  category: 'captions',
  component: SunBleachComponent as any,
  defaultConfig: {
    words: ['FADED', 'SUN', 'BLEACH', 'GHOST'],
    colors: ['#E74C3C', '#3498DB', '#27AE60', '#F39C12'],
    bgColor: '#1a1815',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FADED', 'SUN', 'BLEACH', 'GHOST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E74C3C', '#3498DB', '#27AE60', '#F39C12'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1815', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
