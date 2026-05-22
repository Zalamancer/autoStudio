import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PrismRefractConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const SPECTRUM_COLORS = [
  '#FF0000', // red
  '#FF6600', // orange
  '#FFDD00', // yellow
  '#00CC44', // green
  '#0088FF', // blue
  '#4400FF', // indigo
  '#8800CC', // violet
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Triangular prism in center
    const prismSize = Math.min(width, height) * 0.2
    const prismCx = width * 0.5
    const prismCy = height * 0.5
    const prismRotation = Math.sin(t * 0.3) * 3

    // Prism triangle using CSS borders
    const prismHalf = prismSize / 2

    // Spectral rainbow band exiting prism (right side)
    const spectrumBands: React.ReactNode[] = []
    const bandCount = 7
    const spreadAngle = 18 // degrees of total spread

    for (let b = 0; b < bandCount; b++) {
      const bandAngle = -spreadAngle / 2 + (b / (bandCount - 1)) * spreadAngle
      const angleRad = (bandAngle * Math.PI) / 180
      const bandLength = width * 0.45
      const bandAlpha = 0.06 + Math.sin(t * 1.2 + b * 0.5) * 0.02

      spectrumBands.push(
        <div
          key={`sb${b}`}
          style={{
            position: 'absolute',
            left: prismCx + prismHalf * 0.6,
            top: prismCy,
            width: bandLength,
            height: 3,
            transformOrigin: '0% 50%',
            transform: `rotate(${bandAngle}deg)`,
            background: `linear-gradient(90deg, ${SPECTRUM_COLORS[b]}${Math.round(bandAlpha * 255).toString(16).padStart(2, '0')}, ${SPECTRUM_COLORS[b]}${Math.round(bandAlpha * 0.3 * 255).toString(16).padStart(2, '0')} 70%, transparent)`,
          }}
        />,
      )
    }

    // White light beam entering prism (left side)
    const beamAlpha = 0.08 + Math.sin(t * 0.8) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Incoming white light beam */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: prismCy - 1.5,
            width: prismCx - prismHalf * 0.5,
            height: 3,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,${beamAlpha}) 30%, rgba(255,255,255,${beamAlpha + 0.04}))`,
          }}
        />
        {/* Spectral bands */}
        {spectrumBands}
        {/* Prism shape */}
        <div
          style={{
            position: 'absolute',
            left: prismCx - prismHalf,
            top: prismCy - prismHalf * 0.87,
            width: 0,
            height: 0,
            borderLeft: `${prismHalf}px solid transparent`,
            borderRight: `${prismHalf}px solid transparent`,
            borderBottom: `${prismHalf * 1.73}px solid rgba(200,220,255,0.08)`,
            transform: `rotate(${prismRotation}deg)`,
            filter: 'blur(0.5px)',
          }}
        />
        {/* Prism edge highlights */}
        <div
          style={{
            position: 'absolute',
            left: prismCx - prismHalf,
            top: prismCy - prismHalf * 0.87,
            width: 0,
            height: 0,
            borderLeft: `${prismHalf}px solid transparent`,
            borderRight: `${prismHalf}px solid transparent`,
            borderBottom: `${prismHalf * 1.73}px solid transparent`,
            transform: `rotate(${prismRotation}deg)`,
            filter: 'blur(1px)',
            boxShadow: '0 0 15px rgba(200,220,255,0.04)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    if (phase === 'enter') {
      // White text enters from left, hits "prism point", splits into rainbow
      const ep = easeOutQuint(enterProgress)

      // Before split point (first 40% of enter), show white text moving right
      if (enterProgress < 0.4) {
        const moveP = enterProgress / 0.4
        const xPos = -30 + moveP * 30
        return (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${xPos}%), -50%)`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
              opacity: 0.3 + moveP * 0.7,
            }}
          >
            {word}
          </div>
        )
      }

      // After split point: rainbow dispersion effect
      const splitP = (enterProgress - 0.4) / 0.6
      const splitEased = easeOutQuint(splitP)

      const layers = SPECTRUM_COLORS.map((specColor, si) => {
        const spreadY = ((si - 3) / 3) * 25 * splitEased
        const spreadX = si * 2 * splitEased
        const layerAlpha = splitP < 0.5 ? splitP * 2 : 1 - (splitP - 0.5) * 1.2

        return (
          <div
            key={si}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${spreadX}px), calc(-50% + ${spreadY}px))`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color: specColor,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
              opacity: Math.max(0, layerAlpha * 0.5),
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )
      })

      // Converging to final color
      const finalAlpha = splitP > 0.5 ? (splitP - 0.5) * 2 : 0

      return (
        <>
          {layers}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
              opacity: finalAlpha,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    if (phase === 'hold') {
      // Stable text with subtle rainbow shimmer
      const chars = word.split('').map((ch, ci) => {
        const shimmer = Math.sin(t * 3 + ci * 0.8)
        const specIdx = Math.floor((Math.sin(t * 2 + ci * 0.6) * 0.5 + 0.5) * SPECTRUM_COLORS.length) % SPECTRUM_COLORS.length
        const shimmerColor = shimmer > 0.7 ? SPECTRUM_COLORS[specIdx] : color

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: shimmerColor,
              textShadow: `0 0 8px ${shimmerColor}40, 0 0 20px rgba(255,255,255,0.1)`,
            }}
          >
            {ch}
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
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      )
    }

    // Exit: text disperses back into rainbow spectrum bands flying apart
    const ep = easeInCubic(exitProgress)

    const layers = SPECTRUM_COLORS.map((specColor, si) => {
      const spreadY = ((si - 3) / 3) * 60 * ep
      const spreadX = (si - 3) * 8 * ep
      const layerAlpha = (1 - ep) * 0.5

      return (
        <div
          key={si}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${spreadX}px), calc(-50% + ${spreadY}px))`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            color: specColor,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: Math.max(0, layerAlpha),
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
      )
    })

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: 1 - ep,
          }}
        >
          {word}
        </div>
        {layers}
      </>
    )
  },
}

function PrismRefractComponent(props: MotionGraphicProps<PrismRefractConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-prism-refract',
  title: 'Kinetic Prism Refract',
  description: 'White text passes through triangular prism and splits into rainbow spectrum bands with dispersion effect, light refraction physics',
  tags: ['kinetic', 'typography', 'prism', 'refraction', 'rainbow', 'spectrum', 'dispersion', 'optics'],
  category: 'captions',
  component: PrismRefractComponent as any,
  defaultConfig: {
    words: ['PRISM', 'LIGHT', 'SPECTRUM', 'BEAM'],
    colors: ['#FFFFFF', '#FFEEDD', '#FFFFFF', '#EEEEFF'],
    bgColor: '#06060e',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRISM', 'LIGHT', 'SPECTRUM', 'BEAM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFEEDD', '#FFFFFF', '#EEEEFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06060e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
