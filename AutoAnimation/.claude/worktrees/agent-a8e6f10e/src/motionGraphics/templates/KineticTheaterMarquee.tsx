import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TheaterMarqueeConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c = 1.7
  return 1 + (t - 1) * (t - 1) * ((c + 1) * (t - 1) + c)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Chase lights cycle — offset so they appear to chase around the border
    const chasePhase = (time * 3) % 1

    // Build chase bulbs around the marquee border
    const bulbSize = 10
    const spacing = 24
    const inset = 30
    const bulbs: { x: number; y: number; idx: number }[] = []
    let idx = 0

    // Top edge
    for (let x = inset; x < width - inset; x += spacing) {
      bulbs.push({ x, y: inset - 4, idx: idx++ })
    }
    // Right edge
    for (let y = inset; y < height - inset; y += spacing) {
      bulbs.push({ x: width - inset + 4, y, idx: idx++ })
    }
    // Bottom edge (reversed)
    for (let x = width - inset; x > inset; x -= spacing) {
      bulbs.push({ x, y: height - inset + 4, idx: idx++ })
    }
    // Left edge (reversed)
    for (let y = height - inset; y > inset; y -= spacing) {
      bulbs.push({ x: inset - 4, y, idx: idx++ })
    }

    const totalBulbs = bulbs.length

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deep burgundy / dark theater background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #1a0a0a 0%, #0d0505 100%)',
          }}
        />
        {/* Art Deco decorative frame — outer gold border */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            border: '3px solid #8B7340',
            boxShadow: 'inset 0 0 20px rgba(139,115,64,0.1)',
            pointerEvents: 'none',
          }}
        />
        {/* Inner frame with deco corners */}
        <div
          style={{
            position: 'absolute',
            inset: 40,
            border: '2px solid #5a4a2a',
            pointerEvents: 'none',
          }}
        />
        {/* Marquee sign board background */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '10%',
            right: '10%',
            bottom: '35%',
            background: 'linear-gradient(180deg, #1a0808 0%, #120505 100%)',
            border: '2px solid #3a2a18',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        />
        {/* Chase light bulbs */}
        {bulbs.map((bulb) => {
          // Three-phase chase: each bulb belongs to a group of 3
          const group = bulb.idx % 3
          const bulbPhase = (chasePhase + group / 3) % 1
          const isLit = bulbPhase < 0.6
          const brightness = isLit ? 0.8 + rand(bulb.idx * 17 + frame) * 0.2 : 0.15

          return (
            <div
              key={bulb.idx}
              style={{
                position: 'absolute',
                left: bulb.x - bulbSize / 2,
                top: bulb.y - bulbSize / 2,
                width: bulbSize,
                height: bulbSize,
                borderRadius: '50%',
                background: isLit
                  ? `radial-gradient(circle at 40% 35%, #FFF8E0, #FFD700 40%, #CC8800 100%)`
                  : `radial-gradient(circle at 40% 35%, #4a3a20, #2a1a08)`,
                boxShadow: isLit
                  ? `0 0 ${6 + brightness * 8}px rgba(255,215,0,${brightness * 0.6}), 0 0 ${2 + brightness * 3}px rgba(255,200,50,0.8)`
                  : 'none',
                opacity: brightness,
              }}
            />
          )
        })}
        {/* Top marquee header — "NOW SHOWING" */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(10px, 2vw, 16px)',
            fontWeight: 700,
            color: '#8B7340',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          NOW SHOWING
        </div>
        {/* Bottom deco separator */}
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            left: '20%',
            right: '20%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, #8B7340, transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(2px, 0.6vw, 6px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.4
          let charOpacity = 0
          let bulbGlow = 0
          let scaleY = 1

          if (phase === 'enter') {
            // Letters snap onto the board one by one — like sliding letter tiles
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            const eased = easeOutBack(Math.min(1, p))
            charOpacity = Math.min(1, p * 2.5)
            scaleY = p < 0.1 ? 0 : eased
            bulbGlow = Math.min(1, p * 1.5)
          } else if (phase === 'hold') {
            charOpacity = 1
            scaleY = 1
            // Subtle light pulsation per character
            bulbGlow = 0.85 + Math.sin(f * 0.08 + ci * 0.7) * 0.15
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            charOpacity = 1 - p
            bulbGlow = 1 - p
            scaleY = 1
          }

          if (ch === ' ') {
            return <div key={ci} style={{ width: 'clamp(10px, 2.5vw, 25px)' }} />
          }

          // Bulb-lit text — warm incandescent color
          const glowRadius = bulbGlow * 15

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `scaleY(${scaleY})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Letter with bulb illumination */}
              <span
                style={{
                  fontFamily: "'Impact', 'Haettenschweiler', 'Arial Black', sans-serif",
                  fontSize: 'clamp(32px, 10vw, 120px)',
                  fontWeight: 900,
                  color: bulbGlow > 0.3 ? '#FFF8E0' : '#4a3a20',
                  opacity: charOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  letterSpacing: 1,
                  textShadow: bulbGlow > 0.3
                    ? `0 0 ${glowRadius}px rgba(255,200,50,${bulbGlow * 0.5}), 0 0 ${glowRadius * 2}px rgba(255,180,30,${bulbGlow * 0.2}), 0 2px 4px rgba(0,0,0,0.4)`
                    : '0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function TheaterMarqueeComponent(props: MotionGraphicProps<TheaterMarqueeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-theater-marquee',
  title: 'Theater Marquee',
  description:
    'Classic Broadway theater marquee with chase light bulbs cycling around the border, replaceable letter board, warm incandescent glow, and Art Deco gold frame details.',
  tags: ['kinetic', 'typography', 'theater', 'marquee', 'broadway', 'cinema', 'bulb', 'signage', 'art-deco'],
  category: 'captions',
  component: TheaterMarqueeComponent as any,
  defaultConfig: {
    words: ['SHOWTIME', 'PREMIERE', 'OPENING', 'ENCORE'],
    colors: ['#FFF8E0', '#FFD700', '#FFF8E0', '#FFD700'],
    bgColor: '#0d0505',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHOWTIME', 'PREMIERE', 'OPENING', 'ENCORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8E0', '#FFD700', '#FFF8E0', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
