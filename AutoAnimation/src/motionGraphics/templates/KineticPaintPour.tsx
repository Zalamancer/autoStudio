import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaintPourConfig extends KineticBaseConfig {}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const POUR_COLORS = [
  'rgba(255, 100, 130, 0.5)',
  'rgba(100, 180, 255, 0.45)',
  'rgba(255, 200, 80, 0.4)',
  'rgba(180, 100, 255, 0.45)',
  'rgba(100, 255, 180, 0.4)',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Flowing acrylic paint pour layers
    const layers = Array.from({ length: 5 }, (_, i) => {
      const yBase = height * (0.15 + i * 0.15)
      const flow = Math.sin(t * 0.4 + i * 0.8) * 60
      const flowY = Math.cos(t * 0.3 + i * 1.1) * 20
      const h = 60 + rand(i * 19) * 80
      const colorBase = POUR_COLORS[i % POUR_COLORS.length]

      // Organic flowing shape using wavy border
      const points: string[] = []
      for (let x = 0; x <= 10; x++) {
        const xFrac = x / 10
        const wave = Math.sin(xFrac * Math.PI * 3 + t * 1.2 + i * 0.9) * 20
        const wave2 = Math.cos(xFrac * Math.PI * 2 + t * 0.7 + i * 1.5) * 12
        points.push(`${xFrac * 100}% ${50 + ((wave + wave2) / h) * 100}%`)
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: flow - 20,
            top: yBase + flowY,
            width: width + 40,
            height: h,
            background: `linear-gradient(90deg, transparent 2%, ${colorBase} 15%, ${colorBase} 85%, transparent 98%)`,
            filter: 'blur(12px)',
            borderRadius: '40% 60% 50% 50% / 40% 40% 60% 60%',
            transform: `rotate(${Math.sin(t * 0.2 + i) * 2}deg)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {layers}
        {/* Canvas texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let clipPercent = 100
      let scaleY = 1

      if (phase === 'enter') {
        // Paint pour reveal: text revealed by flowing paint from top
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.7))
        const ep = easeOutQuint(p)

        // Clip from top: paint pours down revealing letter
        clipPercent = ep * 100
        charOpacity = Math.min(1, ep * 1.5)
        // Slight drip stretch
        scaleY = 1 + (1 - ep) * 0.15
      } else if (phase === 'hold') {
        // Gentle paint flow undulation
        yOff = Math.sin(t * 1.5 + ci * 0.5) * 3
        // Color intensity pulse
        charOpacity = 0.9 + Math.sin(t * 2 + ci * 0.4) * 0.1
      } else {
        // Paint drips away downward
        const delay = (word.length - 1 - ci) / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInOut(p)

        // Clip from top: paint drips off bottom
        clipPercent = (1 - ep) * 100
        charOpacity = 1 - ep * 0.5
        yOff = ep * 30
        scaleY = 1 + ep * 0.2
      }

      // Paint drip hanging from bottom of each char
      const showDrip = phase === 'enter' && enterProgress > 0.2 && enterProgress < 0.8
      const dripHeight = showDrip ? Math.sin(ci * 1.7 + t * 4) * 8 + 12 : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleY(${scaleY})`,
            transformOrigin: 'center top',
            clipPath: `inset(${100 - clipPercent}% 0 0 0)`,
            textShadow: `0 2px 8px ${color}60, 0 0 20px ${color}30`,
          }}
        >
          {ch}
          {/* Paint drip */}
          {dripHeight > 0 && (
            <span
              style={{
                position: 'absolute',
                bottom: -dripHeight,
                left: '50%',
                width: 4,
                height: dripHeight,
                transform: 'translateX(-50%)',
                background: `linear-gradient(180deg, ${color}, ${color}40)`,
                borderRadius: '0 0 3px 3px',
              }}
            />
          )}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(46px, 13vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {chars}
      </div>
    )
  },
}

function PaintPourComponent(props: MotionGraphicProps<PaintPourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paint-pour',
  title: 'Kinetic Paint Pour',
  description: 'Acrylic paint pour with text emerging from flowing color layers. Letters reveal via top-down pour with drips, and drain away on exit.',
  tags: ['kinetic', 'typography', 'liquid', 'paint', 'pour', 'acrylic', 'art', 'colorful'],
  category: 'captions',
  component: PaintPourComponent as any,
  defaultConfig: {
    words: ['POUR', 'DRIP', 'BLEND', 'ART'],
    colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'],
    bgColor: '#111118',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POUR', 'DRIP', 'BLEND', 'ART'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111118', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
