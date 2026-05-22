import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SodiumVaporConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Night highway — road with lane markings
    const horizonY = height * 0.45
    const roadBottom = height

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: horizonY,
            background: 'linear-gradient(180deg, #030508 0%, #0A0E15 100%)',
          }}
        />
        {/* Distant treeline / horizon */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path
            d={`M 0 ${horizonY} ${Array.from({ length: 30 }, (_, i) => {
              const x = (i / 29) * width
              const y = horizonY - 5 - rand(i * 23) * 15
              return `L ${x} ${y}`
            }).join(' ')} L ${width} ${horizonY} Z`}
            fill="rgba(8, 12, 18, 0.9)"
          />
        </svg>
        {/* Road surface */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: horizonY,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(25, 28, 32, 0.7) 0%, rgba(30, 32, 36, 0.8) 100%)',
          }}
        />
        {/* Center lane dashes */}
        {Array.from({ length: 6 }, (_, i) => {
          const dashY = horizonY + 20 + i * ((roadBottom - horizonY - 20) / 6)
          const scale = 0.3 + (dashY - horizonY) / (roadBottom - horizonY) * 0.7
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: dashY,
                width: 3 * scale,
                height: 12 * scale,
                background: `rgba(200, 180, 100, ${0.05 + scale * 0.08})`,
                transform: 'translateX(-50%)',
              }}
            />
          )
        })}
        {/* Sodium vapor light poles — receding into distance */}
        {[0.3, 0.5, 0.75].map((dist, i) => {
          const poleX = width * (0.7 + i * 0.02)
          const poleY = horizonY + (height - horizonY) * (1 - dist) * 0.5
          const scale = dist
          const lightOn = true

          return (
            <div key={i}>
              {/* Pole */}
              <div
                style={{
                  position: 'absolute',
                  left: poleX,
                  top: poleY,
                  width: 2 * scale,
                  height: 50 * scale,
                  background: 'rgba(60, 55, 45, 0.2)',
                }}
              />
              {/* Lamp head */}
              <div
                style={{
                  position: 'absolute',
                  left: poleX - 8 * scale,
                  top: poleY - 4 * scale,
                  width: 16 * scale,
                  height: 6 * scale,
                  background: 'rgba(70, 65, 50, 0.2)',
                  borderRadius: 2,
                }}
              />
              {/* Sodium glow cone */}
              {lightOn && (
                <div
                  style={{
                    position: 'absolute',
                    left: poleX - 30 * scale,
                    top: poleY,
                    width: 60 * scale,
                    height: 80 * scale,
                    background: `radial-gradient(ellipse at 50% 0%, rgba(255, 180, 50, ${0.03 * scale}) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
        {/* Overall sodium ambient cast — monochromatic orange-amber */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            top: '30%',
            bottom: '10%',
            background: `radial-gradient(ellipse at 50% 40%, rgba(255, 170, 40, 0.025) 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(20px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Sodium vapor: monochromatic orange-amber — no color rendering
    // This is the characteristic quality of low-pressure sodium lamps
    const sodiumAmber = '#FFB020'
    const sodiumDark = '#CC8800'
    const sodiumCore = '#FFD060'

    let opacity = 0
    let glowIntensity = 0

    if (phase === 'enter') {
      // Sodium lamp warm-up — starts with dim red glow, shifts to characteristic amber
      if (enterProgress < 0.25) {
        // Initial arc — very dim reddish
        const arc = enterProgress / 0.25
        opacity = arc * 0.12
        glowIntensity = arc * 0.05
      } else if (enterProgress < 0.55) {
        // Sodium vaporizing — growing amber glow
        const vapor = (enterProgress - 0.25) / 0.3
        opacity = 0.12 + vapor * 0.38
        glowIntensity = 0.05 + vapor * 0.35
      } else {
        // Full sodium spectrum — monochromatic amber lock-in
        const full = easeOutQuad((enterProgress - 0.55) / 0.45)
        opacity = 0.5 + full * 0.5
        glowIntensity = 0.4 + full * 0.6
      }
    } else if (phase === 'hold') {
      // Stable sodium lamp — very steady with barely perceptible pulse
      const pulse = Math.sin(f * 0.08 + index * 2.3) * 0.025
      opacity = 0.93 + pulse
      glowIntensity = 0.9 + pulse
    } else {
      // Sodium extinguish — amber fades
      const fade = easeOutQuad(exitProgress)
      opacity = Math.max(0, 0.93 * (1 - fade))
      glowIntensity = Math.max(0, 0.9 * (1 - fade))
    }

    const innerGlow = glowIntensity * 15
    const midGlow = glowIntensity * 30
    const outerGlow = glowIntensity * 55

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Road reflection of sodium light below text */}
        {glowIntensity > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '115%',
              left: '-5%',
              right: '-5%',
              height: 30 + glowIntensity * 20,
              background: `linear-gradient(180deg, rgba(255, 170, 40, ${glowIntensity * 0.035}) 0%, transparent 100%)`,
              pointerEvents: 'none',
              filter: 'blur(8px)',
            }}
          />
        )}
        {/* Sodium-lit text — monochromatic, no color variation */}
        <div
          style={{
            fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 800,
            color: glowIntensity > 0.6 ? sodiumCore : sodiumAmber,
            opacity,
            textShadow: glowIntensity > 0
              ? `0 0 ${innerGlow}px ${sodiumAmber},
                 0 0 ${midGlow}px ${sodiumDark},
                 0 0 ${outerGlow}px ${sodiumDark}60,
                 0 2px ${outerGlow * 0.8}px rgba(0, 0, 0, 0.3)`
              : 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
        {/* Monochromatic indicator — everything under sodium is amber */}
        {glowIntensity > 0.5 && (
          <div
            style={{
              position: 'absolute',
              top: '-45%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: `${sodiumDark}20`,
              letterSpacing: 2,
              whiteSpace: 'nowrap',
            }}
          >
            589nm MONOCHROMATIC
          </div>
        )}
      </div>
    )
  },
}

function SodiumVaporComponent(props: MotionGraphicProps<SodiumVaporConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sodium-vapor',
  title: 'Kinetic Sodium Vapor',
  description: 'Monochromatic orange-amber sodium streetlight with highway night backdrop, no color rendering, lane markings, and characteristic 589nm warm glow',
  tags: ['kinetic', 'typography', 'sodium', 'vapor', 'streetlight', 'amber', 'orange', 'highway', 'night', 'monochromatic'],
  category: 'captions',
  component: SodiumVaporComponent as any,
  defaultConfig: {
    words: ['HIGHWAY', 'AMBER', 'NIGHT', 'DRIVE'],
    colors: ['#FFB020', '#CC8800', '#FFD060', '#E8A010'],
    bgColor: '#060810',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HIGHWAY', 'AMBER', 'NIGHT', 'DRIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB020', '#CC8800', '#FFD060', '#E8A010'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
