import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpellcheckWaveConfig extends KineticBaseConfig {
  squiggleAmplitude: number
}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

// Deterministic squiggle path as SVG points
function squigglePath(wordWidth: number, y: number, amplitude: number, phase: number): string {
  const steps = Math.ceil(wordWidth / 4)
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * wordWidth
    const waveY = y + Math.sin((i / steps) * Math.PI * 8 + phase) * amplitude
    points.push(`${x.toFixed(1)},${waveY.toFixed(1)}`)
  }
  return `M ${points.join(' L ')}`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Document / word processor background
    const pageWidth = Math.min(width * 0.9, 560)
    const pageLeft = (width - pageWidth) / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Toolbar simulation at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 36,
            background: 'rgba(245,245,247,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
          }}
        >
          {['B', 'I', 'U'].map((t, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.08)',
                fontFamily: "'Georgia', serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {t}
            </div>
          ))}
        </div>
        {/* Document lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pageLeft,
              width: pageWidth,
              top: 60 + i * 28,
              height: 1,
              background: 'rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 79 + 41

    // Approximate text width
    const approxCharWidth = 52
    const wordWidth = Math.min(word.length * approxCharWidth * 0.65, width * 0.8)

    let opacity = 1
    let squiggleOpacity = 0
    let squiggleProgress = 0
    let resolveProgress = 0

    if (phase === 'enter') {
      // Text types in, then red squiggle draws underneath
      opacity = Math.min(1, enterProgress * 3)
      // Squiggle starts drawing at 60% of enter
      squiggleProgress = Math.max(0, (enterProgress - 0.6) / 0.4)
      squiggleOpacity = squiggleProgress
    } else if (phase === 'hold') {
      opacity = 1
      squiggleOpacity = 1
      // At holdProgress 0.7, squiggle fades out (spellcheck resolves)
      if (holdProgress > 0.65) {
        resolveProgress = (holdProgress - 0.65) / 0.35
        squiggleOpacity = 1 - resolveProgress
      }
    } else {
      opacity = 1 - exitProgress
      squiggleOpacity = 0
    }

    // Squiggle SVG height
    const svgHeight = 12
    const amplitude = 2.5
    // Phase animates the wave for a drawn-on feel
    const wavePhase = squiggleProgress * Math.PI * 2

    // Text color: red-tinted when squiggle is visible, resolves to clean color
    const textColor = squiggleOpacity > 0.1
      ? `rgba(255,180,180,${0.7 + squiggleOpacity * 0.3})`
      : color

    // Clean green flash on resolve
    const cleanFlash = resolveProgress > 0 && resolveProgress < 0.5
      ? `0 0 12px rgba(100,255,150,${resolveProgress * 2 * (1 - resolveProgress * 2)})`
      : undefined

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Main word */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 400,
            color: textColor,
            whiteSpace: 'nowrap',
            letterSpacing: 1,
            textShadow: cleanFlash,
            lineHeight: 1,
          }}
        >
          {word}
        </div>

        {/* Red squiggly underline SVG */}
        {squiggleOpacity > 0 && (
          <svg
            width={wordWidth}
            height={svgHeight}
            style={{
              marginTop: -2,
              opacity: squiggleOpacity,
              overflow: 'visible',
            }}
          >
            {/* Clip path for draw-on animation */}
            <defs>
              <clipPath id={`squiggle-clip-${index}`}>
                <rect x={0} y={0} width={wordWidth * squiggleProgress} height={svgHeight} />
              </clipPath>
            </defs>
            <path
              d={squigglePath(wordWidth, svgHeight / 2, amplitude, wavePhase)}
              stroke="#FF3B30"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath={`url(#squiggle-clip-${index})`}
            />
          </svg>
        )}

        {/* Right-click context hint when squiggle is full */}
        {phase === 'hold' && holdProgress > 0.25 && holdProgress < 0.65 && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: '-10%',
              background: 'rgba(30,30,35,0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              padding: '4px 0',
              minWidth: 120,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 10,
              opacity: Math.min(1, (holdProgress - 0.25) / 0.15),
            }}
          >
            {[word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(), 'Ignore All', 'Add to Dictionary'].map((opt, i) => (
              <div
                key={i}
                style={{
                  padding: '3px 12px',
                  fontFamily: "'Arial', sans-serif",
                  fontSize: 11,
                  color: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
}

function SpellcheckWaveComponent(props: MotionGraphicProps<SpellcheckWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spellcheck-wave',
  title: 'Kinetic Spellcheck Wave',
  description: 'Red squiggly underline draws under text word-processor style, context menu appears, then resolves clean with a green flash',
  tags: ['kinetic', 'typography', 'glitch', 'spellcheck', 'word-processor', 'squiggle', 'document', 'cultural'],
  category: 'captions',
  component: SpellcheckWaveComponent as any,
  defaultConfig: {
    words: ['RECIEVE', 'OCCURED', 'DEFENITELY', 'SEPERATE'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#1c1c1e',
    cycleDuration: 2.2,
    squiggleAmplitude: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RECIEVE', 'OCCURED', 'DEFENITELY', 'SEPERATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1c1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.8, max: 6, group: 'Timing' },
    { key: 'squiggleAmplitude', label: 'Squiggle Height (px)', type: 'number', defaultValue: 3, min: 1, max: 8, group: 'Animation' },
  ],
})
