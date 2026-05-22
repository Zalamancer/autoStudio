import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZXSpectrumConfig extends KineticBaseConfig {}

// ZX Spectrum 15-color palette (bright variants)
const SPECTRUM_COLORS = [
  '#FF0000', '#0000FF', '#FF00FF', '#00FF00',
  '#00FFFF', '#FFFF00', '#FFFFFF',
]

const BASIC_LISTING = [
  '10 PRINT "HELLO"',
  '20 INK 2: PAPER 6',
  '30 FOR I=1 TO 10',
  '40 PRINT AT I,I;"*"',
  '50 NEXT I',
  '60 BEEP .5,12',
  '70 GOTO 30',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Rainbow border stripes (iconic ZX Spectrum loading border)
    const stripeCount = 24
    const stripeHeight = height / stripeCount
    const borderStripes: { y: number; color: string }[] = []
    for (let i = 0; i < stripeCount; i++) {
      const colorIdx = (i + Math.floor(time * 12)) % SPECTRUM_COLORS.length
      borderStripes.push({
        y: i * stripeHeight,
        color: SPECTRUM_COLORS[colorIdx],
      })
    }

    // Loading bar progress
    const loadProgress = (time * 0.15) % 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Rainbow border stripes (left side) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 18, bottom: 0, overflow: 'hidden' }}>
          {borderStripes.map((stripe, i) => (
            <div
              key={`l-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: stripe.y,
                width: 18,
                height: stripeHeight + 1,
                background: stripe.color,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        {/* Rainbow border stripes (right side) */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 18, bottom: 0, overflow: 'hidden' }}>
          {borderStripes.map((stripe, i) => (
            <div
              key={`r-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: stripe.y,
                width: 18,
                height: stripeHeight + 1,
                background: stripe.color,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        {/* Top border stripes */}
        <div style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 12, overflow: 'hidden' }}>
          {Array.from({ length: 12 }, (_, i) => {
            const colorIdx = (i + Math.floor(time * 10)) % SPECTRUM_COLORS.length
            return (
              <div
                key={`t-${i}`}
                style={{
                  position: 'absolute',
                  top: i,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: SPECTRUM_COLORS[colorIdx],
                  opacity: 0.25,
                }}
              />
            )
          })}
        </div>

        {/* Bottom border stripes */}
        <div style={{ position: 'absolute', bottom: 0, left: 18, right: 18, height: 12, overflow: 'hidden' }}>
          {Array.from({ length: 12 }, (_, i) => {
            const colorIdx = (i + Math.floor(time * 10) + 3) % SPECTRUM_COLORS.length
            return (
              <div
                key={`b-${i}`}
                style={{
                  position: 'absolute',
                  top: i,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: SPECTRUM_COLORS[colorIdx],
                  opacity: 0.25,
                }}
              />
            )
          })}
        </div>

        {/* BASIC listing in background */}
        {BASIC_LISTING.map((line, i) => (
          <div
            key={`basic-${i}`}
            style={{
              position: 'absolute',
              left: 28,
              top: 20 + i * 14,
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: '#FFFFFF',
              opacity: 0.08,
              whiteSpace: 'pre',
              letterSpacing: 0,
            }}
          >
            {line}
          </div>
        ))}

        {/* Loading bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 28,
            right: 28,
            height: 6,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              width: `${loadProgress * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF)`,
              opacity: 0.3,
            }}
          />
        </div>

        {/* Attribute clash simulation overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(255,255,255,0.01) 7px, rgba(255,255,255,0.01) 8px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // ZX Spectrum loading: characters materialize through attribute clash
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const charProgress = Math.max(0, Math.min(1, (enterProgress * (chars.length + 2) - ci) / 2))

        if (charProgress < 0.3) {
          // Attribute clash: wrong color bleeds from adjacent cell
          const clashColor = SPECTRUM_COLORS[(ci + index + Math.floor(f * 0.1)) % SPECTRUM_COLORS.length]
          return (
            <span
              key={ci}
              style={{
                color: clashColor,
                background: SPECTRUM_COLORS[(ci + 3) % SPECTRUM_COLORS.length],
                padding: '0 1px',
                opacity: charProgress * 3,
              }}
            >
              {'\u2588'}
            </span>
          )
        }
        if (charProgress < 0.6) {
          // Partially resolved: color bleeding effect
          const bleedColor = SPECTRUM_COLORS[(ci + index) % SPECTRUM_COLORS.length]
          return (
            <span
              key={ci}
              style={{
                color,
                textShadow: `2px 0 0 ${bleedColor}, -2px 0 0 ${bleedColor}`,
              }}
            >
              {ch}
            </span>
          )
        }
        // Fully resolved
        return (
          <span key={ci} style={{ color }}>
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
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {elements}
        </div>
      )
    } else if (phase === 'hold') {
      // Attribute clash color bleeding on edges, 8-bit beep rhythm
      const beepPulse = Math.sin(f * 0.2) > 0.8 ? 0.15 : 0
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        // Subtle attribute clash on alternate characters
        const hasClash = ci % 3 === 0
        const clashColor = SPECTRUM_COLORS[(ci + Math.floor(f * 0.04)) % SPECTRUM_COLORS.length]
        return (
          <span
            key={ci}
            style={{
              color,
              textShadow: hasClash
                ? `1px 0 0 ${clashColor}, -1px 0 0 ${clashColor}`
                : `0 0 ${4 + beepPulse * 10}px ${color}40`,
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
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {elements}
        </div>
      )
    } else {
      // Exit: attribute clash overload, colors bleed everywhere then clear
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const charExit = Math.max(0, Math.min(1, (exitProgress * (chars.length + 2) - ci) / 2))

        if (charExit > 0.5) {
          // Full attribute clash overload
          const clashIdx = (ci + Math.floor(f * 0.15)) % SPECTRUM_COLORS.length
          return (
            <span
              key={ci}
              style={{
                color: SPECTRUM_COLORS[clashIdx],
                background: SPECTRUM_COLORS[(clashIdx + 3) % SPECTRUM_COLORS.length],
                padding: '0 1px',
                opacity: Math.max(0, 1 - (charExit - 0.5) * 2),
              }}
            >
              {'\u2588'}
            </span>
          )
        }
        // Color bleeding intensifies
        const bleedIntensity = charExit * 4
        const bleedColor = SPECTRUM_COLORS[(ci + index) % SPECTRUM_COLORS.length]
        return (
          <span
            key={ci}
            style={{
              color,
              textShadow: `${bleedIntensity}px 0 0 ${bleedColor}, -${bleedIntensity}px 0 0 ${bleedColor}`,
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
            opacity: 1 - exitProgress * 0.3,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {elements}
        </div>
      )
    }
  },
}

function ZXSpectrumComponent(props: MotionGraphicProps<ZXSpectrumConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zx-spectrum',
  title: 'Kinetic ZX Spectrum',
  description:
    'ZX Spectrum loading screen with rainbow border stripes, attribute clash color bleeding, BASIC listing, loading bar, and 8-bit beep aesthetic',
  tags: ['kinetic', 'typography', 'spectrum', 'zx', 'sinclair', 'retro', '8bit', 'computing', 'loading'],
  category: 'captions',
  component: ZXSpectrumComponent as any,
  defaultConfig: {
    words: ['LOAD', 'BEEP', 'POKE', 'PEEK'],
    colors: ['#FFFFFF', '#00FFFF', '#FFFF00', '#00FF00'],
    bgColor: '#000000',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOAD', 'BEEP', 'POKE', 'PEEK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#00FFFF', '#FFFF00', '#00FF00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
