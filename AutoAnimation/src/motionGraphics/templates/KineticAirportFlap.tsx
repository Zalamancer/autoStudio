import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AirportFlapConfig extends KineticBaseConfig {}

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -:.!?'

function getFlapChar(target: string, progress: number, charIndex: number): { char: string; flipping: boolean } {
  const targetIdx = FLAP_CHARS.indexOf(target.toUpperCase())
  if (targetIdx < 0) return { char: target, flipping: false }

  const staggerDelay = charIndex * 0.08
  const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay * 0.5)))

  if (adjustedProgress >= 1) return { char: target.toUpperCase(), flipping: false }

  const totalFlips = targetIdx + Math.floor(FLAP_CHARS.length * 0.3)
  const currentFlip = Math.floor(adjustedProgress * totalFlips)
  const currentChar = FLAP_CHARS[currentFlip % FLAP_CHARS.length]
  return { char: currentChar, flipping: true }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle brushed metal texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)',
        }}
      />
      {/* Header bar */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          right: '10%',
          height: 28,
          background: '#1a3a5c',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          fontFamily: "'Arial', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: '#8ab4e0',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        DEPARTURES
        <span style={{ marginLeft: 'auto', marginRight: 16, fontSize: 10, opacity: 0.6 }}>GATE</span>
        <span style={{ marginRight: 16, fontSize: 10, opacity: 0.6 }}>TIME</span>
        <span style={{ marginRight: 16, fontSize: 10, opacity: 0.6 }}>STATUS</span>
      </div>
      {/* Board frame */}
      <div
        style={{
          position: 'absolute',
          top: '14%',
          left: '9%',
          right: '9%',
          bottom: '20%',
          border: '2px solid #2a2a2a',
          borderRadius: 4,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    let progress = 0

    if (phase === 'enter') {
      progress = enterProgress
    } else if (phase === 'hold') {
      progress = 1
    } else {
      progress = 1
    }

    const opacity = phase === 'exit' ? 1 - Math.pow(exitProgress, 2) : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
          opacity,
        }}
      >
        {chars.map((targetChar, ci) => {
          const { char, flipping } = getFlapChar(targetChar, progress, ci)
          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                width: 'clamp(28px, 7vw, 80px)',
                height: 'clamp(38px, 10vw, 110px)',
                background: '#1a1a1a',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Top half of split flap */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: '#222',
                  borderBottom: '1px solid #0a0a0a',
                  overflow: 'hidden',
                }}
              />
              {/* Bottom half */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: '#1e1e1e',
                  overflow: 'hidden',
                }}
              />
              {/* Character */}
              <span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: 'clamp(22px, 6vw, 68px)',
                  fontWeight: 700,
                  color: flipping ? '#c8a832' : color,
                  textShadow: flipping ? 'none' : `0 0 6px ${color}40`,
                  transform: flipping ? `scaleY(${0.85 + Math.sin(Date.now() * 0.05 + ci) * 0.15})` : 'scaleY(1)',
                }}
              >
                {char}
              </span>
              {/* Center split line */}
              <div
                style={{
                  position: 'absolute',
                  left: 2,
                  right: 2,
                  top: '50%',
                  height: 1,
                  background: 'rgba(0,0,0,0.7)',
                  zIndex: 3,
                }}
              />
            </div>
          )
        })}
      </div>
    )
  },
}

function AirportFlapComponent(props: MotionGraphicProps<AirportFlapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-airport-flap',
  title: 'Airport Flap Board',
  description:
    'Split-flap airport departure board with mechanical character cycling. Each letter spins through the alphabet before landing on the target character, staggered left to right.',
  tags: ['kinetic', 'typography', 'airport', 'flap', 'departure', 'signage', 'mechanical', 'retro'],
  category: 'captions',
  component: AirportFlapComponent as any,
  defaultConfig: {
    words: ['DEPARTING', 'BOARDING', 'DELAYED', 'ON TIME'],
    colors: ['#FFD700', '#00FF88', '#FF4444', '#FFD700'],
    bgColor: '#111111',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPARTING', 'BOARDING', 'DELAYED', 'ON TIME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#00FF88', '#FF4444', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
