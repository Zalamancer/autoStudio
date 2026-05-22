import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StainedGlassConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const GLASS_COLORS = [
  'rgba(180, 40, 40, 0.6)',   // deep red
  'rgba(40, 60, 180, 0.6)',   // cobalt blue
  'rgba(180, 160, 30, 0.55)', // amber gold
  'rgba(30, 150, 60, 0.55)',  // emerald green
  'rgba(140, 40, 160, 0.5)',  // violet
  'rgba(30, 130, 180, 0.5)',  // cerulean
  'rgba(180, 100, 30, 0.55)', // warm orange
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Stained glass mosaic background segments
    const segments: React.ReactNode[] = []
    const cols = 6
    const rows = 8
    const cellW = width / cols
    const cellH = height / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        const glassColor = GLASS_COLORS[idx % GLASS_COLORS.length]
        // Slight offset for organic feel
        const ox = (rand(idx * 31 + 7) - 0.5) * 4
        const oy = (rand(idx * 47 + 13) - 0.5) * 4

        // Light streaming through: varies with time
        const lightPulse = 0.6 + Math.sin(t * 0.8 + idx * 0.3) * 0.15

        segments.push(
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: c * cellW + ox,
              top: r * cellH + oy,
              width: cellW + 2,
              height: cellH + 2,
              background: glassColor,
              opacity: lightPulse * 0.35,
              // Lead came borders
              borderRight: '1.5px solid rgba(40, 40, 40, 0.5)',
              borderBottom: '1.5px solid rgba(40, 40, 40, 0.5)',
            }}
          />,
        )
      }
    }

    // Cathedral light beam from top center
    const beamAngle = Math.sin(t * 0.3) * 8
    const beamOpacity = 0.06 + Math.sin(t * 0.5) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {segments}
        {/* Lead came grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(30,30,30,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(30,30,30,0.2) 1px, transparent 1px)
            `,
            backgroundSize: `${cellW}px ${cellH}px`,
          }}
        />
        {/* Light beam */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: width * 0.5,
            height: height * 1.2,
            transform: `translateX(-50%) rotate(${beamAngle}deg)`,
            transformOrigin: 'top center',
            background: `linear-gradient(180deg, rgba(255,240,200,${beamOpacity + 0.04}), rgba(255,220,150,${beamOpacity}) 40%, transparent 80%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let charScale = 1
      let glowIntensity = 0
      let leadBorderWidth = 0

      if (phase === 'enter') {
        // Glass segments click into place one by one
        const delay = ci / (word.length + 1) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeOutQuart(p)

        charOpacity = ep
        charScale = 0.7 + ep * 0.3
        glowIntensity = p > 0.8 ? (p - 0.8) * 5 : 0 // flash when clicking in
        leadBorderWidth = ep * 2
      } else if (phase === 'hold') {
        charOpacity = 1
        leadBorderWidth = 2
        // Light streaming through shifts color warmth
        glowIntensity = 0.3 + Math.sin(t * 1.5 + ci * 0.4) * 0.2
      } else {
        // Glass dims as if light source moves away
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep * 0.8
        glowIntensity = (1 - ep) * 0.2
        leadBorderWidth = (1 - ep) * 2
        charScale = 1 - ep * 0.1
      }

      // Each character gets a glass segment color from the palette
      const segColor = GLASS_COLORS[(ci + index) % GLASS_COLORS.length]
      // Extract the base color but make it luminous
      const lightColor = `rgba(255, 240, 200, ${glowIntensity * 0.4})`

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `scale(${charScale})`,
            textShadow: [
              `0 0 ${6 + glowIntensity * 15}px ${lightColor}`,
              `0 0 3px rgba(255,255,255,0.4)`,
              `0 0 20px rgba(255,200,100,${glowIntensity * 0.3})`,
            ].join(', '),
            // Lead came border effect on characters
            WebkitTextStroke: leadBorderWidth > 0.5 ? `${leadBorderWidth * 0.5}px rgba(40,35,30,0.4)` : undefined,
          }}
        >
          {/* Glass color fill behind character */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              color: segColor.replace(/[\d.]+\)$/, `${charOpacity * 0.3})`),
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {ch}
          </span>
          {ch}
        </span>
      )
    })

    // Rose window radial glow behind text during hold
    let roseGlow: React.ReactNode = null
    if (phase === 'hold') {
      const glowAlpha = 0.06 + Math.sin(t * 0.8) * 0.02
      roseGlow = (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: width * 0.6,
            height: width * 0.6,
            transform: `translate(-50%, -50%) rotate(${t * 5}deg)`,
            borderRadius: '50%',
            background: `conic-gradient(
              rgba(180,40,40,${glowAlpha}),
              rgba(40,60,180,${glowAlpha}),
              rgba(180,160,30,${glowAlpha}),
              rgba(30,150,60,${glowAlpha}),
              rgba(140,40,160,${glowAlpha}),
              rgba(180,40,40,${glowAlpha})
            )`,
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {roseGlow}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 11vw, 145px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function StainedGlassComponent(props: MotionGraphicProps<StainedGlassConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stained-glass',
  title: 'Kinetic Stained Glass',
  description: 'Stained glass window text formed from colored glass segments with lead came borders, light streams through with cathedral glow',
  tags: ['kinetic', 'typography', 'glass', 'stained', 'cathedral', 'church', 'colorful', 'optics'],
  category: 'captions',
  component: StainedGlassComponent as any,
  defaultConfig: {
    words: ['SACRED', 'LIGHT', 'DIVINE', 'GLORY'],
    colors: ['#FFE8B0', '#FFD080', '#FFF0C8', '#FFE0A0'],
    bgColor: '#0a0a12',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SACRED', 'LIGHT', 'DIVINE', 'GLORY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE8B0', '#FFD080', '#FFF0C8', '#FFE0A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
