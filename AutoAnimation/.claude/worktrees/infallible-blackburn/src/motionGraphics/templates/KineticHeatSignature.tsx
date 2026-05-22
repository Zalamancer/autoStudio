import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticHeatSignature — Military/predator-style heat signature reveal
 *
 * Metaphor: Predator thermal vision — the scene is cold dark purple/blue,
 * but the text radiates body heat. Each character is a heat source with
 * expanding thermal rings (like ripples of heat dissipating outward).
 * Background shows cold ambient thermal noise with faint grid overlay.
 *
 * Enter: heat sources ignite from character cores outward — inner white-hot
 *        nucleus expands to orange/red boundary, per-char stagger.
 * Hold: pulsing heat radiation rings expand from characters, convection drift.
 * Exit: heat dissipates — rings contract, characters cool to ambient blue, fade.
 */

interface HeatSignatureConfig extends KineticBaseConfig {
  radiationRings: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Cold ambient thermal blobs (background heat noise)
    const coldBlobs: React.ReactNode[] = []
    for (let i = 0; i < 16; i++) {
      const seed = i * 61 + 37
      const bx = (rand(seed) * width + Math.sin(time * 0.2 + i * 0.7) * 30) % width
      const by = (rand(seed + 1) * height + Math.cos(time * 0.15 + i * 0.9) * 25) % height
      const blobSize = 30 + rand(seed + 2) * 70
      const coldness = 0.02 + rand(seed + 3) * 0.04
      coldBlobs.push(
        <div
          key={`cold-${i}`}
          style={{
            position: 'absolute',
            left: bx - blobSize / 2,
            top: by - blobSize / 2,
            width: blobSize,
            height: blobSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(60,20,120,${coldness}) 0%, transparent 70%)`,
            filter: 'blur(15px)',
            pointerEvents: 'none',
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cold ambient blobs */}
        {coldBlobs}

        {/* Tactical grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(80,40,140,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(80,40,140,0.04) 1px, transparent 1px)
            `,
            backgroundSize: `${width / 12}px ${height / 8}px`,
            pointerEvents: 'none',
          }}
        />

        {/* Vignette — darker cold edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(5,0,20,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Target designation brackets */}
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '35%',
            width: '50%',
            height: '30%',
            pointerEvents: 'none',
          }}
        >
          {/* Top-left bracket */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 14,
              height: 14,
              borderTop: '1px solid rgba(255,120,40,0.25)',
              borderLeft: '1px solid rgba(255,120,40,0.25)',
            }}
          />
          {/* Top-right bracket */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderTop: '1px solid rgba(255,120,40,0.25)',
              borderRight: '1px solid rgba(255,120,40,0.25)',
            }}
          />
          {/* Bottom-left bracket */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 14,
              height: 14,
              borderBottom: '1px solid rgba(255,120,40,0.25)',
              borderLeft: '1px solid rgba(255,120,40,0.25)',
            }}
          />
          {/* Bottom-right bracket */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderBottom: '1px solid rgba(255,120,40,0.25)',
              borderRight: '1px solid rgba(255,120,40,0.25)',
            }}
          />
        </div>

        {/* HUD label */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,120,40,0.35)',
            letterSpacing: 1.5,
          }}
        >
          IR SIGNATURE &bull; LOCKED
        </div>
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
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const seed = index * 83 + 29

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charSeed = seed + ci * 47
          const charDelay = (ci / (totalChars + 1)) * 0.3
          const heatCenter = 0.5 + rand(charSeed) * 0.5 // how hot this char burns

          let intensity = 0 // 0=cold, 1=white-hot
          let ringExpand = 0 // 0..1 radiation ring expansion
          let shimmerX = 0
          let shimmerY = 0
          let charOpacity = 0

          if (phase === 'enter') {
            const p = Math.max(
              0,
              Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.4)),
            )
            // Phase 1 (0-0.4): cold outline appears
            // Phase 2 (0.4-0.7): nucleus heats up
            // Phase 3 (0.7-1): full heat + ring starts
            if (p < 0.4) {
              const local = p / 0.4
              intensity = local * 0.15
              charOpacity = easeOutExpo(local) * 0.5
              ringExpand = 0
            } else if (p < 0.7) {
              const local = (p - 0.4) / 0.3
              intensity = 0.15 + easeOutExpo(local) * 0.6
              charOpacity = 0.5 + local * 0.4
              ringExpand = local * 0.3
            } else {
              const local = (p - 0.7) / 0.3
              intensity = 0.75 + local * 0.25 * heatCenter
              charOpacity = 0.9 + local * 0.1
              ringExpand = 0.3 + local * 0.7
            }
          } else if (phase === 'hold') {
            // Pulsing heat with expanding radiation rings
            const breathe = Math.sin(holdProgress * Math.PI * 4 + ci * 1.1) * 0.1
            intensity = 0.8 + breathe + rand(charSeed + f) * 0.04
            charOpacity = 1
            // Continuous ring expansion cycle
            ringExpand = 0.5 + Math.sin(holdProgress * Math.PI * 3 + ci * 0.7) * 0.5
            shimmerX = Math.sin(f * 0.12 + ci * 2.1) * 1.5
            shimmerY = Math.sin(f * 0.1 + ci * 1.7) * 1.8
          } else {
            // Cool down and dissipate
            const p = Math.max(
              0,
              Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)),
            )
            if (p < 0.4) {
              // Still hot but radiation rings contracting
              intensity = (1 - p * 1.5) * heatCenter
              charOpacity = 1 - p * 0.3
              ringExpand = Math.max(0, 1 - p * 2.5)
            } else if (p < 0.7) {
              // Cooling to orange/yellow
              const local = (p - 0.4) / 0.3
              intensity = Math.max(0, 0.4 - local * 0.3)
              charOpacity = 0.7 - local * 0.3
              ringExpand = 0
            } else {
              // Fading to cold blue ambient
              const local = (p - 0.7) / 0.3
              intensity = Math.max(0, 0.1 * (1 - local))
              charOpacity = Math.max(0, 0.4 - easeInQuad(local) * 0.5)
              ringExpand = 0
            }
          }

          // Color mapping: cold purple -> orange -> red -> white
          let charColor: string
          let glowColor: string
          if (intensity < 0.2) {
            charColor = `rgb(${80 + intensity * 400}, ${20 + intensity * 100}, ${140 - intensity * 200})`
            glowColor = 'rgba(80,30,140,0.3)'
          } else if (intensity < 0.5) {
            const t = (intensity - 0.2) / 0.3
            charColor = `rgb(${160 + t * 95}, ${60 + t * 60}, ${70 - t * 50})`
            glowColor = `rgba(200,${80 + t * 40},20,0.4)`
          } else if (intensity < 0.8) {
            const t = (intensity - 0.5) / 0.3
            charColor = `rgb(255, ${120 - t * 80}, ${20 + t * 10})`
            glowColor = `rgba(255,${80 - t * 50},10,0.5)`
          } else {
            const t = (intensity - 0.8) / 0.2
            const w = Math.floor(200 + t * 55)
            charColor = `rgb(255, ${40 + t * 215}, ${30 + t * 225})`
            glowColor = `rgba(${w},${w},${w},0.4)`
          }

          const ringSize = 30 + ringExpand * 80

          return (
            <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
              {/* Radiation heat rings */}
              {ringExpand > 0.1 && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: ringSize,
                      height: ringSize,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: `1px solid rgba(255,${80 + intensity * 100},${20 + intensity * 40},${0.15 * ringExpand})`,
                      pointerEvents: 'none',
                      zIndex: -1,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: ringSize * 1.6,
                      height: ringSize * 1.6,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: `1px solid rgba(255,${60 + intensity * 60},10,${0.08 * ringExpand})`,
                      pointerEvents: 'none',
                      zIndex: -1,
                    }}
                  />
                </>
              )}

              {/* Core heat glow */}
              {intensity > 0.3 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 40 + intensity * 50,
                    height: 40 + intensity * 50,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Cold outline layer (visible when partially heated) */}
              {intensity > 0.02 && intensity < 0.5 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Rajdhani', 'Roboto Condensed', sans-serif",
                    fontSize: 'clamp(44px, 12vw, 150px)',
                    fontWeight: 700,
                    color: 'transparent',
                    WebkitTextStroke: `1px rgba(100,40,180,${0.3 + intensity})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
              )}

              {/* Main character — heat colored */}
              <span
                style={{
                  fontFamily: "'Rajdhani', 'Roboto Condensed', sans-serif",
                  fontSize: 'clamp(44px, 12vw, 150px)',
                  fontWeight: 700,
                  color: charColor,
                  opacity: charOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  transform: `translate(${shimmerX}px, ${shimmerY}px)`,
                  textShadow:
                    intensity > 0.4
                      ? `0 0 ${intensity * 15}px ${glowColor}, 0 0 ${intensity * 30}px ${glowColor}`
                      : 'none',
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

function HeatSignatureComponent(props: MotionGraphicProps<HeatSignatureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-heat-signature',
  title: 'Kinetic Heat Signature',
  description:
    'Military/predator-style thermal vision: characters are heat sources radiating expanding thermal rings against a cold purple backdrop with tactical grid, target brackets, and vignette.',
  tags: [
    'kinetic',
    'typography',
    'thermal',
    'heat',
    'signature',
    'infrared',
    'predator',
    'military',
    'radiation',
    'tactical',
  ],
  category: 'captions',
  component: HeatSignatureComponent as any,
  defaultConfig: {
    words: ['LOCK', 'HEAT', 'MARK', 'GLOW'],
    colors: ['#FF6B20', '#FF3D00', '#FFAB00', '#FFFFFF'],
    bgColor: '#08041A',
    cycleDuration: 1.3,
    radiationRings: 3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOCK', 'HEAT', 'MARK', 'GLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B20', '#FF3D00', '#FFAB00', '#FFFFFF'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#08041A',
      group: 'Style',
    },
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
      key: 'radiationRings',
      label: 'Radiation Rings',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 5,
      group: 'Animation',
    },
  ],
})
