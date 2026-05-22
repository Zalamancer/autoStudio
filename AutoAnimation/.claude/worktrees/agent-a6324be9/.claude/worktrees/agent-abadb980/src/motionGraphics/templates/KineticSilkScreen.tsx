import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SilkScreenConfig extends KineticBaseConfig {
  inkViscosity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease-out expo — squeegee snap with viscous ink resistance */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Ease-in cubic — ink lifting cleanly off screen */
function easeInCubic(t: number): number {
  return t * t * t
}

/** Ease-in-out quad — squeegee drag has momentum */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Screen mesh texture — fine grid of the silk screen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(255,255,255,0.02) 2px,
              rgba(255,255,255,0.02) 3px
            ), repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 2px,
              rgba(255,255,255,0.02) 2px,
              rgba(255,255,255,0.02) 3px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Substrate paper texture — organic fibre grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              ${75 + Math.sin(time * 0.2) * 2}deg,
              transparent 0px,
              transparent 8px,
              rgba(200,190,170,0.015) 8px,
              rgba(200,190,170,0.015) 9px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Registration crosshairs — 4 corners */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {[
            { x: 24, y: 24 },
            { x: width - 24, y: 24 },
            { x: 24, y: height - 24 },
            { x: width - 24, y: height - 24 },
          ].map((c, i) => (
            <g key={i} opacity={0.2}>
              <circle cx={c.x} cy={c.y} r={6} fill="none" stroke="#888" strokeWidth={0.5} />
              <line
                x1={c.x - 10}
                y1={c.y}
                x2={c.x + 10}
                y2={c.y}
                stroke="#888"
                strokeWidth={0.4}
              />
              <line
                x1={c.x}
                y1={c.y - 10}
                x2={c.x}
                y2={c.y + 10}
                stroke="#888"
                strokeWidth={0.4}
              />
            </g>
          ))}
          {/* Color test strip — CMYK dots along bottom */}
          {['#00AACC', '#CC0066', '#FFCC00', '#222222'].map((inkColor, i) => (
            <circle
              key={`ink${i}`}
              cx={width / 2 - 24 + i * 16}
              cy={height - 14}
              r={3}
              fill={inkColor}
              opacity={0.25}
            />
          ))}
          {/* Edition marking */}
          <text
            x={width - 14}
            y={height - 8}
            fill="rgba(150,140,120,0.15)"
            fontSize={6}
            fontFamily="'Courier New', monospace"
            textAnchor="end"
          >
            1/50 AP
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    // Squeegee position — drags left-to-right across the frame
    const squeegeeX = phase === 'enter'
      ? easeInOutQuad(enterProgress) * 110 - 10
      : phase === 'exit'
        ? 100 + easeInCubic(exitProgress) * 20
        : -15

    const squeegeeVisible = phase === 'enter' && enterProgress > 0.02 && enterProgress < 0.95

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        {/* Squeegee bar */}
        {squeegeeVisible && (
          <div
            style={{
              position: 'absolute',
              left: `${squeegeeX}%`,
              top: '20%',
              width: 6,
              height: '60%',
              background: 'linear-gradient(90deg, #4A3728 0%, #6B4F3A 40%, #8B6914 80%, #4A3728 100%)',
              borderRadius: 2,
              transform: 'translateX(-50%)',
              boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {/* Squeegee rubber edge */}
            <div
              style={{
                position: 'absolute',
                right: -2,
                top: 0,
                width: 3,
                height: '100%',
                background: 'linear-gradient(90deg, #333 0%, #555 100%)',
                borderRadius: '0 1px 1px 0',
              }}
            />
            {/* Ink buildup in front of squeegee */}
            <div
              style={{
                position: 'absolute',
                left: -8,
                top: '10%',
                width: 8,
                height: '80%',
                background: `linear-gradient(180deg, ${color}40 0%, ${color}60 50%, ${color}40 100%)`,
                borderRadius: '4px 0 0 4px',
                filter: 'blur(2px)',
              }}
            />
          </div>
        )}

        {/* Character rendering */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 3,
            whiteSpace: 'nowrap',
          }}
        >
          {chars.map((ch, ci) => {
            // Each char is revealed as squeegee passes over it
            const charPos = (ci / totalChars) * 90 + 5
            let inkDeposit = 0
            let inkOpacity = 0
            let bleedAmount = 0
            let halftoneOpacity = 0

            if (phase === 'enter') {
              // Ink deposits as squeegee passes character position
              const passProgress = Math.max(0, Math.min(1, (squeegeeX - charPos + 15) / 25))
              inkDeposit = easeOutExpo(passProgress)
              inkOpacity = passProgress > 0 ? Math.min(1, passProgress * 3) : 0
              // Slight ink bleed at edges as ink is freshly pushed
              bleedAmount = passProgress > 0.5 && passProgress < 0.9 ? (passProgress - 0.5) * 2 : 0
            } else if (phase === 'hold') {
              inkDeposit = 1
              inkOpacity = 1
              // Ink settling — slight halftone shimmer
              halftoneOpacity = 0.08 + Math.sin(holdProgress * Math.PI * 5 + ci * 0.7) * 0.04
              // Subtle dry/settle shift
              bleedAmount = Math.sin(holdProgress * Math.PI * 2 + ci * 1.2) * 0.03
            } else {
              // Exit: screen lifts — ink thins, halftone dots separate
              const p = Math.max(0, Math.min(1, (exitProgress - (ci / totalChars) * 0.3) / 0.7))
              const eased = easeInCubic(p)
              inkDeposit = 1
              inkOpacity = 1 - eased
              halftoneOpacity = eased * 0.3
            }

            // Per-char ink coverage variation (screen imperfections)
            const coverageVar = 0.85 + rand(ci * 43 + index * 17) * 0.15

            return (
              <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
                {/* Layer 1: Ink bleed/spread — slightly larger, blurred */}
                {bleedAmount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                      fontSize: 'clamp(44px, 12vw, 150px)',
                      fontWeight: 900,
                      color,
                      display: 'inline-block',
                      opacity: bleedAmount * 0.15 * inkOpacity,
                      filter: `blur(${2 + bleedAmount * 3}px)`,
                      transform: `scale(${1.02 + bleedAmount * 0.03})`,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      pointerEvents: 'none',
                    }}
                  >
                    {ch}
                  </span>
                )}
                {/* Layer 2: Main ink deposit — solid squeegee pass */}
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                    fontSize: 'clamp(44px, 12vw, 150px)',
                    fontWeight: 900,
                    color,
                    display: 'inline-block',
                    opacity: inkOpacity * inkDeposit * coverageVar,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
                {/* Layer 3: Halftone dot overlay — screen printing artifact */}
                {(halftoneOpacity > 0 || inkDeposit > 0.5) && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -2,
                      pointerEvents: 'none',
                      opacity: halftoneOpacity > 0 ? halftoneOpacity : 0.06 * inkDeposit,
                      mixBlendMode: 'multiply',
                    }}
                  >
                    {Array.from({ length: 8 }, (_, di) => {
                      const dx = (rand(ci * 61 + di * 11) - 0.5) * 28
                      const dy = (rand(ci * 37 + di * 23) - 0.5) * 40
                      const dotSize = 1.5 + rand(ci * 19 + di * 31) * 2
                      return (
                        <div
                          key={di}
                          style={{
                            position: 'absolute',
                            left: `calc(50% + ${dx}px)`,
                            top: `calc(50% + ${dy}px)`,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: '50%',
                            background: color,
                            opacity: 0.4,
                          }}
                        />
                      )
                    })}
                  </div>
                )}
                {/* Ink texture grain on top of deposited ink */}
                {inkDeposit > 0.6 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `repeating-linear-gradient(
                        ${rand(ci * 71) * 20 + 80}deg,
                        transparent 0px,
                        transparent 1px,
                        rgba(0,0,0,0.03) 1px,
                        rgba(0,0,0,0.03) 2px
                      )`,
                      pointerEvents: 'none',
                      mixBlendMode: 'multiply',
                      opacity: inkDeposit * inkOpacity * 0.5,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Pass number indicator */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: `${color}25`,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            pass 1 of 1 — flood + stroke
          </div>
        )}
      </div>
    )
  },
}

function SilkScreenComponent(props: MotionGraphicProps<SilkScreenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-silk-screen',
  title: 'Kinetic Silk Screen',
  description:
    'Squeegee drags ink across mesh screen to deposit text — halftone dot artifacts, ink bleed, registration crosshairs, and CMYK test marks',
  tags: ['kinetic', 'typography', 'silkscreen', 'serigraphy', 'print', 'textile', 'fabric', 'ink', 'craft', 'squeegee'],
  category: 'captions',
  component: SilkScreenComponent as any,
  defaultConfig: {
    words: ['PRINT', 'PRESS', 'LAYER', 'INK'],
    colors: ['#E84040', '#D43535', '#CC2828', '#E04848'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.3,
    inkViscosity: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'PRESS', 'LAYER', 'INK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E84040', '#D43535', '#CC2828', '#E04848'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'inkViscosity',
      label: 'Ink Viscosity',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 2,
      group: 'Animation',
    },
  ],
})
