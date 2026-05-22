import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MercuryVaporConfig extends KineticBaseConfig {
  warmupSpeed: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Urban night scene — dark asphalt, distant buildings
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #050810 0%, #0A1020 40%, #101828 100%)',
          }}
        />
        {/* Distant building silhouettes */}
        {Array.from({ length: 8 }, (_, i) => {
          const bx = (i / 8) * width
          const bw = 30 + rand(i * 37) * 50
          const bh = 40 + rand(i * 53) * (height * 0.35)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: bx,
                bottom: height * 0.25,
                width: bw,
                height: bh,
                background: 'rgba(15, 20, 30, 0.8)',
                borderRadius: '2px 2px 0 0',
              }}
            >
              {/* Occasional lit window */}
              {Array.from({ length: 3 }, (_, j) => {
                if (rand(i * 71 + j * 13) > 0.4) return null
                return (
                  <div
                    key={j}
                    style={{
                      position: 'absolute',
                      left: 4 + rand(i * 31 + j * 7) * (bw - 10),
                      top: 8 + j * (bh / 4),
                      width: 3,
                      height: 4,
                      background: 'rgba(255, 200, 100, 0.08)',
                    }}
                  />
                )
              })}
            </div>
          )
        })}
        {/* Street level */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '25%',
            background: 'linear-gradient(180deg, rgba(20, 25, 35, 0.6) 0%, rgba(15, 18, 25, 0.9) 100%)',
          }}
        />
        {/* Street lamp post */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '25%',
            width: 3,
            height: '35%',
            background: 'rgba(50, 55, 60, 0.25)',
            transform: 'translateX(-50%)',
          }}
        />
        {/* Lamp housing */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '35%',
            width: 30,
            height: 12,
            background: 'rgba(60, 65, 70, 0.2)',
            transform: 'translateX(-50%)',
            borderRadius: '3px 3px 0 0',
          }}
        />
        {/* Mercury vapor light cone — cold blue-white */}
        <div
          style={{
            position: 'absolute',
            left: '35%',
            right: '35%',
            top: '40%',
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(180, 200, 240, 0.04) 0%, rgba(160, 190, 230, 0.02) 50%, transparent 100%)',
            clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Long shadows from mercury lamp */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            bottom: 0,
            width: '40%',
            height: '20%',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, transparent 100%)',
            clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Mercury vapor colors — cold blue-white spectrum
    const mercuryCold = '#B8C8E8'
    const mercuryBlue = '#8898C0'
    const mercuryCore = '#D8E0F0'

    let opacity = 0
    let warmth = 0 // 0 = cold blue, 1 = warmer white (mercury warm-up arc)
    let glowIntensity = 0

    if (phase === 'enter') {
      // Mercury vapor slow warm-up arc — characteristic delay
      if (enterProgress < 0.3) {
        // Arc strike — dim reddish-blue initial arc
        const strike = easeInCubic(enterProgress / 0.3)
        opacity = strike * 0.15
        warmth = 0
        glowIntensity = strike * 0.08
      } else if (enterProgress < 0.6) {
        // Mercury vaporizing — brightness slowly increasing, shifting from red to blue
        const vaporize = (enterProgress - 0.3) / 0.3
        opacity = 0.15 + vaporize * 0.35
        warmth = vaporize * 0.3
        glowIntensity = 0.08 + vaporize * 0.3
        // Occasional arc flicker during warm-up
        if (rand(f + index * 41) < 0.08) {
          opacity *= 0.6
        }
      } else {
        // Full mercury vapor — cold blue-white established
        const full = easeOutQuad((enterProgress - 0.6) / 0.4)
        opacity = 0.5 + full * 0.5
        warmth = 0.3 + full * 0.7
        glowIntensity = 0.4 + full * 0.6
      }
    } else if (phase === 'hold') {
      // Stable mercury vapor — cold, steady, slight hum pulse
      const humPulse = Math.sin(f * 0.12 + index * 1.7) * 0.04
      opacity = 0.92 + humPulse
      warmth = 1
      glowIntensity = 0.88 + humPulse
    } else {
      // Cool down — mercury vapor takes time to restrike
      if (exitProgress < 0.3) {
        opacity = 0.9 * (1 - exitProgress / 0.3 * 0.3)
        warmth = 1 - exitProgress / 0.3 * 0.4
        glowIntensity = 0.85 * (1 - exitProgress / 0.3 * 0.4)
      } else {
        const fade = (exitProgress - 0.3) / 0.7
        opacity = Math.max(0, 0.6 * (1 - easeOutQuad(fade)))
        warmth = 0.6 * (1 - fade)
        glowIntensity = Math.max(0, 0.5 * (1 - easeOutQuad(fade)))
      }
    }

    // Blend mercury colors based on warm-up state
    const textColor = warmth > 0.7 ? mercuryCore : (warmth > 0.3 ? mercuryCold : mercuryBlue)
    const glowColor = mercuryBlue
    const glowSize = glowIntensity * 20
    const outerGlow = glowIntensity * 40

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Shadow beneath text — long mercury shadow */}
        {glowIntensity > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              left: '5%',
              right: '5%',
              height: 60 + glowIntensity * 40,
              background: `linear-gradient(180deg, rgba(0, 0, 0, ${glowIntensity * 0.08}) 0%, transparent 100%)`,
              transform: 'scaleY(1.5)',
              pointerEvents: 'none',
              filter: 'blur(6px)',
            }}
          />
        )}
        {/* Main mercury-lit text */}
        <div
          style={{
            fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 800,
            color: textColor,
            opacity,
            textShadow: glowIntensity > 0
              ? `0 0 ${glowSize * 0.3}px ${glowColor},
                 0 0 ${glowSize}px ${glowColor},
                 0 0 ${outerGlow}px ${glowColor}80,
                 0 ${glowIntensity * 3}px ${outerGlow * 1.2}px rgba(0, 0, 0, 0.3)`
              : 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
        {/* Cold light cone indicator */}
        {glowIntensity > 0.5 && (
          <div
            style={{
              position: 'absolute',
              top: '-60%',
              left: '50%',
              width: 2,
              height: 30,
              background: `linear-gradient(180deg, ${glowColor}15, transparent)`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function MercuryVaporComponent(props: MotionGraphicProps<MercuryVaporConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mercury-vapor',
  title: 'Kinetic Mercury Vapor',
  description: 'Cold blue-white mercury vapor streetlight with slow warm-up arc, urban night backdrop, building silhouettes, and long hard shadows',
  tags: ['kinetic', 'typography', 'mercury', 'vapor', 'streetlight', 'cold', 'blue', 'urban', 'night', 'shadow'],
  category: 'captions',
  component: MercuryVaporComponent as any,
  defaultConfig: {
    words: ['URBAN', 'COLD', 'NIGHT', 'LAMP'],
    colors: ['#B8C8E8', '#8898C0', '#D8E0F0', '#A0B0D0'],
    bgColor: '#080C14',
    cycleDuration: 1.5,
    warmupSpeed: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['URBAN', 'COLD', 'NIGHT', 'LAMP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8C8E8', '#8898C0', '#D8E0F0', '#A0B0D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'warmupSpeed', label: 'Warm-up Speed', type: 'number', defaultValue: 50, min: 10, max: 100, group: 'Animation' },
  ],
})
