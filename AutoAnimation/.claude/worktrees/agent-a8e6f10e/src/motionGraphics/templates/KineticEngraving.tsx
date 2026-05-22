import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EngravingConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Currency/certificate paper with guilloche hint
    const lines: React.ReactNode[] = []
    // Fine horizontal ruling like security paper
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * height
      lines.push(
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: '100%',
            height: 0.5,
            background: `rgba(0,80,40,${0.02 + hash(i * 41) * 0.015})`,
          }}
        />
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lines}
        {/* Subtle border frame like a bank note */}
        <div
          style={{
            position: 'absolute',
            inset: 15,
            border: '2px solid rgba(0,80,40,0.06)',
            borderRadius: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 20,
            border: '0.5px solid rgba(0,80,40,0.04)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 113 + 37
    const chars = word.split('')

    // Engraving is built up stroke by stroke — crosshatch lines reveal letter forms
    // We simulate this with multiple layered text shadows that build up
    const maxLayers = 6

    let layersRevealed = 0
    let mainOpacity = 0
    let lineThickness = 0 // simulates engraving line weight
    let crosshatchAngle = 0

    if (phase === 'enter') {
      const t = enterProgress
      // Lines build up from thin to thick, layer by layer
      layersRevealed = Math.floor(t * maxLayers)
      const layerFraction = (t * maxLayers) % 1
      mainOpacity = t * 0.9
      lineThickness = 0.3 + t * 0.7
      crosshatchAngle = t * 45 // crosshatch rotates as it builds
    } else if (phase === 'hold') {
      layersRevealed = maxLayers
      mainOpacity = 0.9 + holdProgress * 0.1
      lineThickness = 1
      crosshatchAngle = 45
    } else {
      const t = exitProgress
      layersRevealed = Math.max(0, Math.floor((1 - t) * maxLayers))
      mainOpacity = (1 - t) * 0.9
      lineThickness = 1 - t * 0.7
      crosshatchAngle = 45 - t * 30
    }

    // Build crosshatch text shadows for engraving depth
    const shadows: string[] = []
    for (let l = 0; l < layersRevealed; l++) {
      const angle = (l / maxLayers) * 90
      const rad = (angle * Math.PI) / 180
      const dist = (l + 1) * 0.4
      const ox = Math.cos(rad) * dist
      const oy = Math.sin(rad) * dist
      const alpha = 0.15 + (l / maxLayers) * 0.1
      shadows.push(`${ox}px ${oy}px 0 rgba(0,60,30,${alpha})`)
    }
    // Main body shadow
    shadows.push(`0 0 ${lineThickness * 0.5}px ${color}`)

    // Per-character staggered reveal (burin cutting each letter)
    const renderedChars = chars.map((ch, ci) => {
      const charDelay = ci / chars.length * 0.4
      let charOpacity = 0
      let charScale = 1
      let strokeProgress = 0

      if (phase === 'enter') {
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
        charOpacity = cp
        charScale = 0.98 + cp * 0.02
        strokeProgress = cp
      } else if (phase === 'hold') {
        charOpacity = 1
        charScale = 1
        strokeProgress = 1
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.7))
        charOpacity = 1 - cp
        charScale = 1 - cp * 0.02
        strokeProgress = 1 - cp
      }

      // Fine line weight: thin strokes thicken as engraving deepens
      const strokeWidth = lineThickness * strokeProgress

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity: charOpacity,
            transform: `scale(${charScale})`,
            color,
            WebkitTextStroke: `${strokeWidth}px ${color}`,
            // Initially outline only, fills in as engraving deepens
            WebkitTextFillColor: strokeProgress > 0.6
              ? color
              : `rgba(0,60,30,${strokeProgress * 0.4})`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Decorative crosshatch lines flanking the text
    const hatchLines: React.ReactNode[] = []
    if (layersRevealed > 2) {
      const numLines = Math.min(layersRevealed, 4)
      for (let i = 0; i < numLines; i++) {
        const yOff = (i - numLines / 2) * 3
        const lineOpacity = mainOpacity * 0.2
        hatchLines.push(
          <div
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              top: `calc(50% + ${yOff + 50}px)`,
              height: 0.5,
              background: color,
              opacity: lineOpacity,
            }}
          />
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {hatchLines}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Copperplate Gothic', 'Trajan Pro', 'Georgia', serif",
            fontSize: 'clamp(42px, 12vw, 160px)',
            fontWeight: 400, // Engraving is typically lighter weight
            letterSpacing: 8,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            textShadow: shadows.join(', '),
            opacity: mainOpacity,
          }}
        >
          {renderedChars}
        </div>
        {/* Decorative rule below text */}
        {layersRevealed > 3 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(50% + 55px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120 * mainOpacity,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              opacity: mainOpacity * 0.5,
            }}
          />
        )}
      </div>
    )
  },
}

function EngravingComponent(props: MotionGraphicProps<EngravingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-engraving',
  title: 'Kinetic Engraving',
  description: 'Fine line engraving reveal like currency or certificate art — crosshatch lines build up stroke by stroke to form letterforms',
  tags: ['kinetic', 'typography', 'engraving', 'intaglio', 'currency', 'certificate', 'crosshatch', 'fine-line'],
  category: 'captions',
  component: EngravingComponent as any,
  defaultConfig: {
    words: ['TRUST', 'HONOR', 'ELITE', 'FINE'],
    colors: ['#1a3c28', '#1a3c28', '#2a1a0a', '#1a3c28'],
    bgColor: '#F0EDE4',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRUST', 'HONOR', 'ELITE', 'FINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a3c28', '#1a3c28', '#2a1a0a', '#1a3c28'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0EDE4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
