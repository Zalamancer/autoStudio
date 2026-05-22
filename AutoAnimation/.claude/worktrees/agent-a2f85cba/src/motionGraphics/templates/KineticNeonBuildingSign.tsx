import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonBuildingSignConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #060612 0%, #0a0a1e 25%, #0e0e28 50%, #121230 70%, #181840 100%)',
          }}
        />
        {/* Stars — small scattered dots */}
        {Array.from({ length: 15 }, (_, i) => {
          const sx = rand(i * 31) * 80 + 10
          const sy = rand(i * 47) * 35 + 2
          const twinkle = 0.3 + Math.sin(time * (1 + rand(i * 53) * 2) + rand(i * 71) * 6) * 0.3
          return (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                left: `${sx}%`,
                top: `${sy}%`,
                width: 2,
                height: 2,
                borderRadius: '50%',
                background: '#fff',
                opacity: twinkle,
              }}
            />
          )
        })}
        {/* Cityscape silhouette — building outlines */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '45%',
          }}
        >
          {/* Building 1 — tall left */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '2%',
              width: '12%',
              height: '85%',
              background: 'linear-gradient(180deg, #0c0c1a 0%, #08081a 100%)',
            }}
          >
            {/* Windows */}
            {Array.from({ length: 8 }, (_, r) =>
              Array.from({ length: 2 }, (_, c) => {
                const lit = rand(r * 7 + c * 13) > 0.4
                return (
                  <div
                    key={`w1-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: `${20 + c * 40}%`,
                      top: `${8 + r * 11}%`,
                      width: '25%',
                      height: '5%',
                      background: lit ? 'rgba(255,220,120,0.15)' : 'transparent',
                      borderRadius: 1,
                    }}
                  />
                )
              })
            ).flat()}
          </div>
          {/* Building 2 — short middle-left */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '15%',
              width: '10%',
              height: '50%',
              background: '#0a0a18',
            }}
          />
          {/* Building 3 — main building with the neon sign (center) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '26%',
              width: '48%',
              height: '75%',
              background: 'linear-gradient(180deg, #0e0e22 0%, #0a0a1a 100%)',
            }}
          >
            {/* Rooftop structure where sign mounts */}
            <div
              style={{
                position: 'absolute',
                top: -6,
                left: '10%',
                right: '10%',
                height: 6,
                background: '#0c0c20',
                borderRadius: '2px 2px 0 0',
              }}
            />
            {/* Building windows */}
            {Array.from({ length: 6 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => {
                const lit = rand(r * 11 + c * 23 + 100) > 0.5
                return (
                  <div
                    key={`w3-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: `${8 + c * 18}%`,
                      top: `${20 + r * 13}%`,
                      width: '10%',
                      height: '6%',
                      background: lit ? `rgba(255,220,120,${0.08 + rand(r * 3 + c * 5) * 0.1})` : 'transparent',
                      borderRadius: 1,
                    }}
                  />
                )
              })
            ).flat()}
          </div>
          {/* Building 4 — right */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: '5%',
              width: '18%',
              height: '60%',
              background: '#0b0b1c',
            }}
          />
          {/* Building 5 — far right short */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: '0%',
              width: '8%',
              height: '40%',
              background: '#090918',
            }}
          />
        </div>
        {/* Atmospheric haze at horizon */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: 0,
            right: 0,
            height: '15%',
            background: 'linear-gradient(180deg, transparent, rgba(20,20,60,0.15))',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(3px, 1vw, 10px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.5
          let tubeOpacity = 0
          let glowIntensity = 0
          let flickering = false

          if (phase === 'enter') {
            // Neon tubes buzz on one at a time — with initial flicker
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

            if (p < 0.3) {
              // Dark — tube not yet powered
              tubeOpacity = 0.05
              glowIntensity = 0
            } else if (p < 0.6) {
              // Flicker ignition — unstable gas
              const flickerP = (p - 0.3) / 0.3
              const flickerSeed = ci * 43 + f
              flickering = rand(flickerSeed) < (0.6 - flickerP * 0.5)
              tubeOpacity = flickering ? 0.1 : (0.3 + flickerP * 0.3)
              glowIntensity = flickering ? 0.05 : flickerP * 0.5
            } else {
              // Stable — fully lit
              const stableP = easeOutCubic((p - 0.6) / 0.4)
              tubeOpacity = 0.6 + stableP * 0.4
              glowIntensity = 0.5 + stableP * 0.5
            }
          } else if (phase === 'hold') {
            // Stable neon with gentle pulsation and rare flicker
            const flickerSeed = ci * 37 + f
            flickering = rand(flickerSeed) < 0.015
            tubeOpacity = flickering ? 0.5 : (0.9 + Math.sin(holdProgress * Math.PI * 3 + ci * 0.8) * 0.1)
            glowIntensity = flickering ? 0.3 : (0.85 + Math.sin(holdProgress * Math.PI * 2 + ci) * 0.15)
          } else {
            // Power down — from outside in or random
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            const flickerSeed = ci * 61 + f
            if (p < 0.4) {
              flickering = rand(flickerSeed) < p * 0.8
              tubeOpacity = flickering ? 0.15 : (1 - p * 0.5)
              glowIntensity = flickering ? 0.05 : (1 - p)
            } else {
              tubeOpacity = Math.max(0.03, (1 - p) * 0.3)
              glowIntensity = 0
            }
          }

          if (ch === ' ') {
            return <div key={ci} style={{ width: 'clamp(8px, 2.5vw, 22px)' }} />
          }

          const neonGlow = glowIntensity * 20
          const outerGlow = glowIntensity * 35

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Neon tube character */}
              <span
                style={{
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', 'Trebuchet MS', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 130px)',
                  fontWeight: 700,
                  color: glowIntensity > 0.4 ? '#FFFFFF' : color,
                  opacity: tubeOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  letterSpacing: 3,
                  textShadow: glowIntensity > 0
                    ? `0 0 ${neonGlow * 0.4}px ${color},
                       0 0 ${neonGlow}px ${color},
                       0 0 ${outerGlow}px ${color},
                       0 0 ${outerGlow * 1.8}px ${color}60,
                       0 0 ${outerGlow * 2.5}px ${color}30`
                    : 'none',
                }}
              >
                {ch}
              </span>
              {/* Warm glow cast onto the building rooftop below */}
              {glowIntensity > 0.3 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-40%',
                    width: 'clamp(30px, 8vw, 80px)',
                    height: 'clamp(20px, 5vw, 50px)',
                    transform: 'translateX(-50%)',
                    background: `radial-gradient(ellipse at 50% 0%, ${color}${Math.floor(glowIntensity * 12).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                    zIndex: -1,
                  }}
                />
              )}
              {/* Upward atmospheric glow — light pollution into sky */}
              {glowIntensity > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '-60%',
                    width: 'clamp(40px, 10vw, 100px)',
                    height: 'clamp(30px, 8vw, 80px)',
                    transform: 'translateX(-50%)',
                    background: `radial-gradient(ellipse at 50% 100%, ${color}06 0%, transparent 60%)`,
                    filter: 'blur(12px)',
                    pointerEvents: 'none',
                    zIndex: -1,
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

function NeonBuildingSignComponent(props: MotionGraphicProps<NeonBuildingSignConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-building-sign',
  title: 'Rooftop Neon Sign',
  description:
    'Large-scale neon sign on a building rooftop at night with cityscape silhouette, twinkling stars, window lights, atmospheric glow, and flicker-on ignition sequence. Vintage downtown ambiance.',
  tags: ['kinetic', 'typography', 'neon', 'rooftop', 'building', 'sign', 'cityscape', 'night', 'downtown', 'signage', 'glow'],
  category: 'captions',
  component: NeonBuildingSignComponent as any,
  defaultConfig: {
    words: ['HOTEL', 'VACANCY', 'LOUNGE', 'DRINKS'],
    colors: ['#FF3366', '#00E5FF', '#FF9500', '#FF3366'],
    bgColor: '#060612',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOTEL', 'VACANCY', 'LOUNGE', 'DRINKS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00E5FF', '#FF9500', '#FF3366'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060612', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
