import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StadiumBoardConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky — dark stadium background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 40%, #0d0d20 70%, #101025 100%)',
          }}
        />
        {/* Scoreboard housing — dark metal frame */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            right: '8%',
            bottom: '20%',
            background: '#0a0a0a',
            borderRadius: 6,
            border: '4px solid #2a2a2a',
            boxShadow: '0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* LED panel area — slightly lighter */}
          <div
            style={{
              position: 'absolute',
              inset: 8,
              background: '#050508',
              borderRadius: 2,
            }}
          />
          {/* Dot matrix grid — visible LED pixel grid */}
          <div
            style={{
              position: 'absolute',
              inset: 8,
              backgroundImage: `
                radial-gradient(circle at center, rgba(255,255,255,0.02) 0.5px, transparent 0.5px)
              `,
              backgroundSize: '6px 6px',
              pointerEvents: 'none',
            }}
          />
        </div>
        {/* Stadium light floodlight glow — top corners */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%',
            height: '20%',
            background: 'radial-gradient(ellipse at 0% 0%, rgba(255,240,200,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '30%',
            height: '20%',
            background: 'radial-gradient(ellipse at 100% 0%, rgba(255,240,200,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Crowd energy — simulated audience dots at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '18%',
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 40 }, (_, i) => {
            const cx = rand(i * 31) * 100
            const cy = rand(i * 47) * 100
            const bobPhase = time * 2 + rand(i * 71) * Math.PI * 2
            const bob = Math.sin(bobPhase) * 3
            const brightness = 0.15 + rand(i * 53) * 0.15
            const hue = rand(i * 13) > 0.7 ? '#FFD700' : (rand(i * 17) > 0.5 ? '#FF4444' : '#4488FF')

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${cx}%`,
                  top: `${cy + bob}%`,
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: hue,
                  opacity: brightness,
                }}
              />
            )
          })}
        </div>
        {/* Score / status bar below the main display */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '12%',
            right: '12%',
            height: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            color: 'rgba(255,200,50,0.4)',
            letterSpacing: 2,
          }}
        >
          <span>HOME 3</span>
          <span>QTR 4</span>
          <span>AWAY 2</span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const totalChars = chars.length
    const f = frame ?? 0

    // Dot matrix pixel transition styles
    let displayMode: 'scroll' | 'full' | 'fadeout' = 'full'
    let scrollOffset = 0
    let globalOpacity = 1
    let pixelRevealProgress = 0

    if (phase === 'enter') {
      // Pixel rows scan from top to bottom — like an LED board refresh
      displayMode = 'scroll'
      pixelRevealProgress = easeOutQuart(enterProgress)
      globalOpacity = 1
    } else if (phase === 'hold') {
      displayMode = 'full'
      pixelRevealProgress = 1
      globalOpacity = 1
    } else {
      // Pixels dissolve randomly — like dot matrix clearing
      displayMode = 'fadeout'
      pixelRevealProgress = 1
      globalOpacity = 1 - easeOutQuart(exitProgress)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(3px, 1vw, 10px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          if (ch === ' ') {
            return <div key={ci} style={{ width: 'clamp(10px, 3vw, 28px)' }} />
          }

          // Per-character pixel reveal
          const charProgress = displayMode === 'scroll'
            ? Math.max(0, Math.min(1, (pixelRevealProgress - ci / (totalChars + 1) * 0.3) / 0.7))
            : 1

          // Pixel dissolve on exit — random per character
          const dissolveAmount = displayMode === 'fadeout'
            ? Math.max(0, (exitProgress - ci * 0.05) * 1.2)
            : 0

          // LED glow intensity
          const glowIntensity = charProgress * (1 - dissolveAmount)

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Main LED character */}
              <span
                style={{
                  fontFamily: "'Courier New', 'Share Tech Mono', 'DotGothic16', monospace",
                  fontSize: 'clamp(36px, 11vw, 130px)',
                  fontWeight: 900,
                  color: color,
                  display: 'inline-block',
                  lineHeight: 1,
                  letterSpacing: 3,
                  opacity: glowIntensity,
                  // LED glow — each pixel emits light
                  textShadow: glowIntensity > 0.3
                    ? `0 0 ${4 + glowIntensity * 8}px ${color}80, 0 0 ${2 + glowIntensity * 4}px ${color}, 0 0 ${8 + glowIntensity * 15}px ${color}40`
                    : 'none',
                }}
              >
                {ch}
              </span>
              {/* Scan line wipe effect during enter */}
              {displayMode === 'scroll' && charProgress < 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${charProgress * 100}%`,
                    bottom: 0,
                    background: '#050508',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Active pixel shimmer */}
              {glowIntensity > 0.7 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '80%',
                    height: '80%',
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 60%)`,
                    filter: 'blur(6px)',
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

function StadiumBoardComponent(props: MotionGraphicProps<StadiumBoardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stadium-board',
  title: 'Stadium Scoreboard',
  description:
    'Dot matrix LED scoreboard with pixel scan-line reveal, crowd energy dots, stadium floodlights, and LED glow. Text enters via top-to-bottom pixel scan and exits with random dissolve.',
  tags: ['kinetic', 'typography', 'stadium', 'scoreboard', 'led', 'dot-matrix', 'sports', 'arena', 'signage', 'pixel'],
  category: 'captions',
  component: StadiumBoardComponent as any,
  defaultConfig: {
    words: ['GOAL', 'DEFENSE', 'TIMEOUT', 'WINNER'],
    colors: ['#FFD700', '#FF4444', '#00FF88', '#FFD700'],
    bgColor: '#050510',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GOAL', 'DEFENSE', 'TIMEOUT', 'WINNER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF4444', '#00FF88', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
