import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DigitalTwinConfig extends KineticBaseConfig {}

// Deterministic glitch char substitution
const GLITCH_CHARS = '█▓▒░|/\\[]{}01'
function glitchChar(seed: number): string {
  const idx = Math.floor(Math.abs(Math.sin(seed * 5231) * 9999)) % GLITCH_CHARS.length
  return GLITCH_CHARS[idx]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Periodic glitch bars (horizontal displaced segments)
    const glitchBars = Array.from({ length: 3 }, (_, i) => {
      const seed = i * 71 + 3
      const period = 40 + i * 17
      const active = Math.floor(frame / period) % 3 === i % 3
      if (!active) return null
      const y = (Math.abs(Math.sin(seed + frame * 0.01)) * 0.7 + 0.1) * height
      const barH = 6 + i * 4
      const shift = (Math.sin(seed + frame * 0.05) * 20)
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: shift,
            right: -shift,
            top: y,
            height: barH,
            background: i % 2 === 0
              ? 'rgba(0,255,255,0.06)'
              : 'rgba(255,0,255,0.06)',
            filter: 'blur(0.5px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {glitchBars}

        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,255,0.01) 3px, rgba(0,255,255,0.01) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Center vertical divider — digital mirror axis */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '10%',
            bottom: '10%',
            width: 1,
            background: 'linear-gradient(180deg, transparent, rgba(0,255,255,0.12), rgba(255,0,255,0.12), transparent)',
            transform: 'translateX(-50%)',
          }}
        />

        {/* Corner tag */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,0,255,0.25)',
            letterSpacing: 2,
            textAlign: 'right',
          }}
        >
          TWIN.SYNC | DELTA {String(frame % 100).padStart(2, '0')}ms
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Primary text slides in from left; ghost (twin) slides in from right, slightly offset
      const primaryX = (1 - enterProgress) * -60
      const twinX = (1 - enterProgress) * 60
      const opacity = Math.min(1, enterProgress * 2.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Ghost / digital twin — magenta, offset right and above */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${twinX + 6}px, -6px)`,
              opacity: opacity * 0.3,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: '#FF00FF',
                textShadow: '0 0 8px #FF00FF',
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
                filter: 'blur(1px)',
              }}
            >
              {word}
            </span>
          </div>

          {/* Primary text */}
          <div
            style={{
              transform: `translateX(${primaryX}px)`,
              opacity,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 10px ${color}, 0 0 25px ${color}50`,
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Twin periodically desynchronizes — glitching a few characters
      const glitchTick = Math.floor(holdProgress * 8)
      const isGlitching = glitchTick % 4 === 0
      const glitchOffset = isGlitching ? Math.sin(holdProgress * 31) * 8 : 0
      const glitchSkewY = isGlitching ? Math.sin(holdProgress * 17) * 2 : 0

      // Build glitched twin word
      const twinLetters = word.split('').map((ch, i) => {
        const shouldGlitch = isGlitching && i % 3 === glitchTick % 3
        return shouldGlitch ? glitchChar(i * 13 + glitchTick) : ch
      })
      const twinWord = twinLetters.join('')

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Glitchy digital twin offset behind */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${glitchOffset + 5}px, -5px) skewY(${glitchSkewY}deg)`,
              opacity: 0.25,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: '#FF00FF',
                textShadow: '0 0 10px #FF00FF40',
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
                filter: isGlitching ? 'blur(1.5px)' : 'blur(0.5px)',
              }}
            >
              {twinWord}
            </span>
          </div>

          {/* Primary text — crisp */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 28px ${color}50`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      )
    } else {
      // Exit: primary fades out while twin drifts and dissolves
      const opacity = 1 - exitProgress
      const twinDrift = exitProgress * 30
      const twinOpacity = Math.max(0, 0.3 - exitProgress * 0.6)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${twinDrift}px, -5px)`,
              opacity: twinOpacity,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: '#FF00FF',
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
                filter: 'blur(3px)',
              }}
            >
              {word}
            </span>
          </div>

          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity,
            }}
          >
            {word}
          </span>
        </div>
      )
    }
  },
}

function DigitalTwinComponent(props: MotionGraphicProps<DigitalTwinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-digital-twin',
  title: 'Kinetic Digital Twin',
  description: 'Text appears alongside a glitchy magenta digital mirror copy that periodically desynchronizes with scrambled characters and offset drift',
  tags: ['kinetic', 'typography', 'digital', 'twin', 'glitch', 'mirror', 'cyberpunk', 'sci-fi', 'futuristic'],
  category: 'captions',
  component: DigitalTwinComponent as any,
  defaultConfig: {
    words: ['SYNC', 'CLONE', 'MIRROR', 'TWIN'],
    colors: ['#00FFFF', '#00FFFF', '#0066FF', '#00FFFF'],
    bgColor: '#0a0a12',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SYNC', 'CLONE', 'MIRROR', 'TWIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#00FFFF', '#0066FF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
