import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagnifyGlassConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Detective aesthetic: faint scattered text / document lines
    const lines: React.ReactNode[] = []
    const numLines = 12
    for (let i = 0; i < numLines; i++) {
      const ly = height * (0.1 + (i / numLines) * 0.8)
      const lw = width * (0.3 + rand(i * 41) * 0.5)
      const lx = width * rand(i * 67 + 11) * 0.3

      lines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: lx,
            top: ly,
            width: lw,
            height: 1.5,
            background: `rgba(120, 100, 80, ${0.04 + rand(i * 29) * 0.03})`,
            borderRadius: 1,
          }}
        />,
      )
    }

    // Parchment texture overlay
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.15) 100%)`,
          }}
        />
        {/* Warm ambient light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${50 + Math.sin(t * 0.3) * 15}% ${45 + Math.cos(t * 0.2) * 10}%, rgba(180,150,100,0.06), transparent 50%)`,
          }}
        />
        {lines}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Magnifying glass position — sweeps across text
    let glassX = 0.5 // 0-1 normalized position
    let glassY = 0.5
    let glassScale = 1
    let glassOpacity = 0
    let textScale = 0.45 // small text baseline
    let textOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutQuart(enterProgress)
      // Glass slides in from left
      glassX = -0.1 + ep * 0.6
      glassY = 0.5
      glassScale = 0.7 + ep * 0.3
      glassOpacity = ep
      textOpacity = 0.3 + ep * 0.7
      textScale = 0.45
    } else if (phase === 'hold') {
      // Glass slowly drifts across the text
      glassX = 0.35 + Math.sin(t * 1.2) * 0.15
      glassY = 0.5 + Math.cos(t * 0.8) * 0.03
      glassScale = 1
      glassOpacity = 1
      textOpacity = 1
      textScale = 0.45
    } else {
      const ep = easeInCubic(exitProgress)
      // Glass lifts away
      glassX = 0.5
      glassY = 0.5 - ep * 0.3
      glassScale = 1 - ep * 0.3
      glassOpacity = 1 - ep
      textOpacity = 1 - ep * 0.7
      textScale = 0.45
    }

    // Glass dimensions
    const glassRadius = Math.min(width, height) * 0.18
    const glassCenterX = width * glassX
    const glassCenterY = height * glassY

    // Per-character magnification based on distance from glass center
    const fontSize = 'clamp(42px, 12vw, 155px)'
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5
      // Approximate character position (centered text)
      const charX = width * (0.3 + charNorm * 0.4)
      const charY = height * 0.5

      // Distance from glass center
      const dx = charX - glassCenterX
      const dy = charY - glassCenterY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const withinGlass = dist < glassRadius

      // Magnification: characters under glass appear larger
      let charScale = textScale
      let charColor = color
      let aberration = ''

      if (withinGlass && glassOpacity > 0.3) {
        const proximity = 1 - dist / glassRadius
        const magnify = 1 + proximity * 1.2 // up to 2.2x enlargement
        charScale = textScale * magnify

        // Chromatic aberration at edges of lens
        if (proximity < 0.5 && proximity > 0.1) {
          const abStrength = (0.5 - proximity) * 3
          aberration = `${abStrength}px 0 rgba(255,0,0,0.15), -${abStrength}px 0 rgba(0,0,255,0.15)`
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: charColor,
            opacity: textOpacity,
            transform: `scale(${charScale})`,
            transformOrigin: 'center bottom',
            textShadow: aberration || undefined,
            transition: 'transform 0.05s ease-out',
          }}
        >
          {ch}
        </span>
      )
    })

    // Magnifying glass visual
    const handleAngle = 135
    const handleRad = (handleAngle * Math.PI) / 180
    const handleLength = glassRadius * 1.2
    const handleX = glassCenterX + Math.cos(handleRad) * (glassRadius + handleLength * 0.3)
    const handleY = glassCenterY + Math.sin(handleRad) * (glassRadius + handleLength * 0.3)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Small base text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>

        {/* Magnifying glass ring */}
        <div
          style={{
            position: 'absolute',
            left: glassCenterX - glassRadius,
            top: glassCenterY - glassRadius,
            width: glassRadius * 2,
            height: glassRadius * 2,
            borderRadius: '50%',
            border: `3px solid rgba(180, 160, 120, ${glassOpacity * 0.6})`,
            background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,${glassOpacity * 0.06}), rgba(200,220,240,${glassOpacity * 0.03}) 50%, transparent)`,
            boxShadow: `0 0 20px rgba(180,160,120,${glassOpacity * 0.15}), inset 0 0 30px rgba(255,255,255,${glassOpacity * 0.04})`,
            transform: `scale(${glassScale})`,
            pointerEvents: 'none',
          }}
        >
          {/* Lens highlight */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '30%',
              height: '20%',
              borderRadius: '50%',
              background: `rgba(255,255,255,${glassOpacity * 0.12})`,
              filter: 'blur(4px)',
              transform: 'rotate(-20deg)',
            }}
          />
        </div>

        {/* Handle */}
        <div
          style={{
            position: 'absolute',
            left: handleX,
            top: handleY,
            width: handleLength,
            height: 6,
            background: `linear-gradient(180deg, rgba(160,140,100,${glassOpacity * 0.7}), rgba(120,100,70,${glassOpacity * 0.5}))`,
            borderRadius: 3,
            transform: `rotate(${handleAngle}deg)`,
            transformOrigin: '0% 50%',
            boxShadow: `0 2px 4px rgba(0,0,0,${glassOpacity * 0.2})`,
          }}
        />
      </div>
    )
  },
}

function MagnifyGlassComponent(props: MotionGraphicProps<MagnifyGlassConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magnify-glass',
  title: 'Kinetic Magnifying Glass',
  description: 'Small text enlarged where magnifying glass hovers, lens distortion, chromatic edge aberration, detective aesthetic',
  tags: ['kinetic', 'typography', 'magnify', 'glass', 'lens', 'detective', 'zoom', 'optics'],
  category: 'captions',
  component: MagnifyGlassComponent as any,
  defaultConfig: {
    words: ['CLUE', 'SEARCH', 'REVEAL', 'FOUND'],
    colors: ['#E8D8B8', '#D8C8A0', '#F0E0C0', '#E0D0B0'],
    bgColor: '#1a1610',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CLUE', 'SEARCH', 'REVEAL', 'FOUND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D8B8', '#D8C8A0', '#F0E0C0', '#E0D0B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
