import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ContactSheetConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const cols = 4
    const rows = 3
    const cellW = width / cols
    const cellH = height / rows

    const cells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellIndex = r * cols + c
        const seed = cellIndex * 37 + 11
        // Slightly varied exposure per cell
        const exposure = 0.03 + (Math.sin(seed) * 0.5 + 0.5) * 0.04
        cells.push(
          <div
            key={cellIndex}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              border: '0.5px solid rgba(255,255,255,0.08)',
              background: `rgba(255,255,255,${exposure})`,
              boxSizing: 'border-box',
            }}
          />
        )
      }
    }

    // Sprocket holes along top and bottom
    const sprockets = []
    const sprocketCount = 12
    for (let i = 0; i < sprocketCount; i++) {
      const x = (i / sprocketCount) * 100 + 4
      sprockets.push(
        <div key={`top-${i}`} style={{ position: 'absolute', top: 2, left: `${x}%`, width: 10, height: 6, borderRadius: 1, background: 'rgba(255,255,255,0.06)' }} />,
        <div key={`bot-${i}`} style={{ position: 'absolute', bottom: 2, left: `${x}%`, width: 10, height: 6, borderRadius: 1, background: 'rgba(255,255,255,0.06)' }} />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {cells}
        {sprockets}
        {/* Film edge text */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,150,50,0.2)',
            letterSpacing: 2,
          }}
        >
          KODAK 400TX
        </div>
        {/* Frame numbers along left edge */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(255,150,50,0.15)',
          }}
        >
          {`${Math.floor(time * 2) + 1}A`}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 47 + 29
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Pop in like selecting a frame on the contact sheet
      opacity = enterProgress
      scale = 0.85 + enterProgress * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
    }

    // Red grease pencil circle animation during hold
    const showCircle = phase === 'hold'
    const circleProgress = phase === 'hold' ? Math.min(holdProgress * 3, 1) : 0
    // Circle stroke dasharray for drawing animation
    const circumference = 300
    const circleStroke = circleProgress * circumference

    return (
      <>
        {/* Main text in contact sheet frame style */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity,
          }}
        >
          {word}
        </div>
        {/* Red grease pencil circle — "keeper" selection mark */}
        {showCircle && (
          <svg
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 30vw, 400px)',
              height: 'clamp(80px, 20vw, 260px)',
              pointerEvents: 'none',
            }}
            viewBox="0 0 200 130"
          >
            <ellipse
              cx="100"
              cy="65"
              rx="90"
              ry="55"
              fill="none"
              stroke="rgba(220,40,30,0.6)"
              strokeWidth="2.5"
              strokeDasharray={`${circleStroke} ${circumference}`}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-5deg)',
                transformOrigin: 'center',
              }}
            />
          </svg>
        )}
        {/* Grease pencil check mark after circle completes */}
        {showCircle && holdProgress > 0.5 && (
          <div
            style={{
              position: 'absolute',
              top: '28%',
              right: '22%',
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(16px, 4vw, 40px)',
              color: 'rgba(220,40,30,0.5)',
              transform: 'rotate(-8deg)',
              opacity: Math.min((holdProgress - 0.5) * 4, 1),
            }}
          >
            &check;
          </div>
        )}
        {/* Frame number bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            right: '15%',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(10px, 2.5vw, 20px)',
            color: 'rgba(255,150,50,0.3)',
            opacity,
          }}
        >
          {`${index + 1}A`}
        </div>
      </>
    )
  },
}

function ContactSheetComponent(props: MotionGraphicProps<ContactSheetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-contact-sheet',
  title: 'Kinetic Contact Sheet',
  description: 'Photographic contact sheet: text appears in small frames with sprocket holes and red grease pencil marks select the keeper',
  tags: ['kinetic', 'typography', 'contact-sheet', 'film', 'photography', 'darkroom', 'analog', 'frames'],
  category: 'captions',
  component: ContactSheetComponent as any,
  defaultConfig: {
    words: ['SELECT', 'KEEPER', 'PROOF', 'FRAME'],
    colors: ['#e0d8cc', '#d0c8bc', '#e8e0d4', '#c8c0b4'],
    bgColor: '#111111',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SELECT', 'KEEPER', 'PROOF', 'FRAME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e0d8cc', '#d0c8bc', '#e8e0d4', '#c8c0b4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
