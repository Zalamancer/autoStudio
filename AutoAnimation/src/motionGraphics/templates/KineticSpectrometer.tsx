import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpectrometerConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/** Map wavelength (380-780nm) to visible color */
function wavelengthToColor(nm: number): string {
  let r = 0, g = 0, b = 0
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60; b = 1
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / 50; b = 1
  } else if (nm >= 490 && nm < 510) {
    g = 1; b = -(nm - 510) / 20
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / 70; g = 1
  } else if (nm >= 580 && nm < 645) {
    r = 1; g = -(nm - 645) / 65
  } else if (nm >= 645 && nm <= 780) {
    r = 1
  }
  // Intensity falloff at edges
  let factor = 1
  if (nm >= 380 && nm < 420) factor = 0.3 + 0.7 * (nm - 380) / 40
  else if (nm > 700 && nm <= 780) factor = 0.3 + 0.7 * (780 - nm) / 80

  r = Math.round(r * factor * 255)
  g = Math.round(g * factor * 255)
  b = Math.round(b * factor * 255)
  return `rgb(${r},${g},${b})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Full visible spectrum band across the middle
    const spectrumY = height * 0.75
    const spectrumHeight = height * 0.12
    const spectrumBars: React.ReactNode[] = []
    const barCount = 100
    const barWidth = width / barCount

    for (let i = 0; i < barCount; i++) {
      const nm = 380 + (i / barCount) * 400
      const color = wavelengthToColor(nm)
      spectrumBars.push(
        <rect
          key={`sp${i}`}
          x={i * barWidth}
          y={spectrumY}
          width={barWidth + 1}
          height={spectrumHeight}
          fill={color}
          opacity={0.7}
        />
      )
    }

    // Emission lines (bright lines on dark)
    const emissionLines: React.ReactNode[] = []
    const emissionWavelengths = [410, 434, 486, 518, 546, 589, 616, 656]
    for (const nm of emissionWavelengths) {
      const xPos = ((nm - 380) / 400) * width
      const intensity = 0.4 + Math.sin(frame * 0.04 + nm * 0.01) * 0.2
      const lineColor = wavelengthToColor(nm)
      emissionLines.push(
        <g key={`em${nm}`}>
          <line
            x1={xPos} y1={spectrumY - 30}
            x2={xPos} y2={spectrumY + spectrumHeight + 20}
            stroke={lineColor}
            strokeWidth={2}
            opacity={intensity + 0.3}
          />
          <line
            x1={xPos} y1={spectrumY - 30}
            x2={xPos} y2={spectrumY + spectrumHeight + 20}
            stroke="white"
            strokeWidth={0.5}
            opacity={intensity * 0.3}
          />
        </g>
      )
    }

    // Wavelength scale
    const scaleLabels: React.ReactNode[] = []
    for (let nm = 400; nm <= 750; nm += 50) {
      const xPos = ((nm - 380) / 400) * width
      scaleLabels.push(
        <g key={`sc${nm}`}>
          <line
            x1={xPos} y1={spectrumY + spectrumHeight}
            x2={xPos} y2={spectrumY + spectrumHeight + 8}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.5}
          />
          <text
            x={xPos} y={spectrumY + spectrumHeight + 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.2)"
            fontSize={8}
            fontFamily="monospace"
          >
            {nm}
          </text>
        </g>
      )
    }

    // Absorption dark lines (Fraunhofer-like)
    const absorptionLines: React.ReactNode[] = []
    const absorptionWavelengths = [393, 430, 470, 527, 570, 610, 687]
    for (const nm of absorptionWavelengths) {
      const xPos = ((nm - 380) / 400) * width
      absorptionLines.push(
        <line
          key={`ab${nm}`}
          x1={xPos} y1={spectrumY}
          x2={xPos} y2={spectrumY + spectrumHeight}
          stroke="rgba(0,0,0,0.6)"
          strokeWidth={1.5}
        />
      )
    }

    // Prismatic dispersion triangle hint
    const prismX = width * 0.08
    const prismY = spectrumY - 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Spectrum */}
          {spectrumBars}
          {absorptionLines}
          {emissionLines}
          {scaleLabels}

          {/* Prism icon */}
          <polygon
            points={`${prismX},${prismY + 30} ${prismX + 20},${prismY} ${prismX + 40},${prismY + 30}`}
            fill="none"
            stroke="rgba(200,200,255,0.15)"
            strokeWidth={1}
          />

          {/* nm label */}
          <text
            x={width - 12} y={spectrumY + spectrumHeight + 18}
            textAnchor="end"
            fill="rgba(255,255,255,0.15)"
            fontSize={8}
            fontFamily="monospace"
          >
            nm
          </text>
        </svg>

        {/* Rainbow prismatic glow in upper area */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: spectrumY,
            background: `linear-gradient(90deg,
              rgba(100,0,180,0.03), rgba(0,0,200,0.03), rgba(0,180,180,0.03),
              rgba(0,180,0,0.03), rgba(200,200,0,0.03), rgba(200,80,0,0.03), rgba(200,0,0,0.03))`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const letters = word.split('')

    // Each letter gets a different spectral color shift
    const renderSpectralText = (opacity: number, revealProgress: number) => (
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          opacity,
        }}
      >
        {letters.map((letter, i) => {
          const letterProgress = Math.max(0, Math.min(1, (revealProgress * letters.length - i)))
          if (letterProgress <= 0) return <span key={i} style={{ width: 'clamp(20px, 5vw, 60px)' }} />

          // Spectral color for this letter position
          const nm = 420 + (i / Math.max(1, letters.length - 1)) * 280
          const spectralColor = wavelengthToColor(nm)
          const shimmer = Math.sin(f * 0.06 + i * 1.2) * 0.1

          return (
            <span
              key={i}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 130px)',
                fontWeight: 700,
                color: phase === 'hold' ? spectralColor : color,
                textShadow: `0 0 8px ${spectralColor}, 0 0 20px ${spectralColor}40`,
                opacity: letterProgress + shimmer,
                display: 'inline-block',
                transform: `translateY(${(1 - letterProgress) * 10}px)`,
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )

    if (phase === 'enter') {
      // Letters appear through spectral band sweep left-to-right
      return renderSpectralText(1, enterProgress)
    } else if (phase === 'hold') {
      // Rainbow shimmer across letters
      return renderSpectralText(1, 1)
    } else {
      // Fade with prismatic dispersion - letters spread
      return (
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2 + exitProgress * 8,
            opacity: 1 - exitProgress,
          }}
        >
          {letters.map((letter, i) => {
            const nm = 420 + (i / Math.max(1, letters.length - 1)) * 280
            const spectralColor = wavelengthToColor(nm)
            const dispersion = exitProgress * (i - letters.length / 2) * 5

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(36px, 10vw, 130px)',
                  fontWeight: 700,
                  color: spectralColor,
                  textShadow: `0 0 ${6 + exitProgress * 8}px ${spectralColor}`,
                  display: 'inline-block',
                  transform: `translateY(${dispersion}px)`,
                  filter: `blur(${exitProgress * 3}px)`,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function SpectrometerComponent(props: MotionGraphicProps<SpectrometerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spectrometer',
  title: 'Kinetic Spectrometer',
  description: 'Spectrometer emission/absorption spectrum with rainbow prismatic bands, wavelength scale, and text revealed through spectral color sweep',
  tags: ['kinetic', 'typography', 'spectrometer', 'spectrum', 'rainbow', 'prism', 'science', 'light'],
  category: 'captions',
  component: SpectrometerComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'WAVE', 'PRISM', 'BAND'],
    colors: ['#ff6644', '#44ff66', '#4466ff', '#ffcc44'],
    bgColor: '#080808',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'WAVE', 'PRISM', 'BAND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6644', '#44ff66', '#4466ff', '#ffcc44'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
