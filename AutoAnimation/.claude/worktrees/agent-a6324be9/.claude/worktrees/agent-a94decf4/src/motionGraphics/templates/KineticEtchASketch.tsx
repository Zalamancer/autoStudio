import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EtchASketchConfig extends KineticBaseConfig {
  drawSpeed: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#CC0000' }}>
        {/* Etch-a-Sketch body — red frame with rounded corners */}
        <div
          style={{
            position: 'absolute',
            inset: '5%',
            background: '#CC0000',
            borderRadius: 20,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Screen area */}
          <div
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '8%',
              bottom: '25%',
              background: bgColor,
              borderRadius: 4,
              border: '3px solid #AA0000',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Screen aluminum powder texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 1px,
                  rgba(180,180,180,0.04) 1px,
                  rgba(180,180,180,0.04) 2px
                )`,
                pointerEvents: 'none',
              }}
            />
            {/* Prior faint drawings — ghost lines */}
            {[17, 31, 47, 61].map((seed, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${10 + rand(seed) * 40}%`, top: `${10 + rand(seed + 14) * 40}%`,
                width: `${20 + rand(seed + 30) * 30}%`, height: 1,
                background: 'rgba(100,100,100,0.08)', transform: `rotate(${rand(seed + 7) * 40 - 20}deg)`, pointerEvents: 'none',
              }} />
            ))}
          </div>
          {/* Dials — left and right */}
          {[{ side: 'left', speed: 30 }, { side: 'right', speed: -20 }].map(({ side, speed }) => (
            <div
              key={side}
              style={{
                position: 'absolute', [side]: '15%', bottom: '6%', width: '14%', aspectRatio: '1',
                borderRadius: '50%', background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 50%, #C0C0C0 100%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)',
                transform: `rotate(${time * speed}deg)`,
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%', width: '90%', height: 1,
                  background: 'rgba(0,0,0,0.1)', transformOrigin: 'center center',
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                }} />
              ))}
            </div>
          ))}
          {/* Brand label */}
          <div
            style={{
              position: 'absolute',
              top: '3%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 2vw, 16px)',
              color: '#FFFFFF',
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            SKETCH
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    if (phase === 'exit') {
      // Shake to erase — whole screen shakes then fades
      const shakeX = Math.sin(f * 1.2) * 8 * exitProgress
      const shakeY = Math.cos(f * 0.9) * 6 * exitProgress
      const erase = easeOutCubic(exitProgress)

      return (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px))`,
            opacity: 1 - erase,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(30px, 8vw, 110px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      )
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / totalChars * 0.7
          let drawP = 0
          let jitterX = 0
          let jitterY = 0

          if (phase === 'enter') {
            drawP = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.6)))
            // Etch-a-Sketch constraint: movement is stepped/jagged (H/V only)
            if (drawP > 0 && drawP < 1) {
              const stepSize = 2
              jitterX = Math.round(Math.sin(f * 0.8 + ci * 3) * stepSize)
              jitterY = Math.round(Math.cos(f * 0.6 + ci * 5) * stepSize)
            }
          } else {
            drawP = 1
            // Subtle wobble during hold
            jitterX = Math.round(Math.sin(holdProgress * Math.PI * 2 + ci) * 0.5)
          }

          // Reveal via clip — horizontal line draw constraint
          const clipPercent = drawP * 100

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translate(${jitterX}px, ${jitterY}px)`,
              }}
            >
              {/* Drawn character — thin aluminum scrape line */}
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(30px, 8vw, 110px)',
                  fontWeight: 700,
                  color: drawP > 0 ? color : 'transparent',
                  display: 'inline-block',
                  clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
                  letterSpacing: 4,
                  // Thin scratchy line look
                  WebkitTextStroke: drawP > 0.5 ? 'none' : `1px ${color}`,
                  lineHeight: 1,
                }}
              >
                {ch}
              </span>
              {/* Stylus cursor at drawing edge */}
              {phase === 'enter' && drawP > 0.05 && drawP < 0.95 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${clipPercent}%`,
                    top: '50%',
                    width: 3,
                    height: 3,
                    background: color,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 4px ${color}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function EtchASketchComponent(props: MotionGraphicProps<EtchASketchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-etch-a-sketch',
  title: 'Kinetic Etch-a-Sketch',
  description: 'Text drawn on Etch-a-Sketch with horizontal/vertical drawing constraint, rotating dials, and shake-to-erase exit',
  tags: ['kinetic', 'typography', 'etch', 'sketch', 'toy', 'retro', 'craft', 'draw', 'nostalgic'],
  category: 'captions',
  component: EtchASketchComponent as any,
  defaultConfig: {
    words: ['DRAW', 'TURN', 'ETCH', 'SHAKE'],
    colors: ['#444444', '#444444', '#444444', '#444444'],
    bgColor: '#C8C8C0',
    cycleDuration: 1.5,
    drawSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAW', 'TURN', 'ETCH', 'SHAKE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#444444', '#444444', '#444444'], group: 'Style' },
    { key: 'bgColor', label: 'Screen Color', type: 'color', defaultValue: '#C8C8C0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'drawSpeed', label: 'Draw Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
