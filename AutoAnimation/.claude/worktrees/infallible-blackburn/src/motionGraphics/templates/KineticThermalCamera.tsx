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
 * KineticThermalCamera — FLIR thermal camera scan
 *
 * Metaphor: A handheld FLIR thermal imaging camera pointed at a surface.
 * Characters appear as heat sources — cold (blue/purple) at edges, searing
 * white-hot at center. Background has drifting thermal convection blobs,
 * a temperature scale bar, crosshair reticle, and scan-line noise.
 *
 * Enter: characters heat up from cold blue -> green -> yellow -> red -> white,
 *        per-char stagger simulating uneven thermal mass.
 * Hold: convection shimmer — characters pulse between red/white with heat waves.
 * Exit: characters cool down in reverse (white -> red -> yellow -> blue -> gone).
 */

interface ThermalCameraConfig extends KineticBaseConfig {
  heatIntensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/** Map 0..1 heat value to FLIR palette color */
function thermalColor(heat: number): string {
  if (heat < 0.15) return `rgba(20, 10, 80, ${0.3 + heat * 4})`       // deep cold blue
  if (heat < 0.3) return `rgba(40, 20, 180, ${0.6 + heat})`           // blue
  if (heat < 0.45) return `rgba(0, 180, 120, ${0.7 + heat * 0.5})`    // green
  if (heat < 0.6) return `rgba(200, 200, 0, ${0.8 + heat * 0.2})`     // yellow
  if (heat < 0.8) return `rgba(255, 80, 0, ${0.85 + heat * 0.15})`    // orange-red
  if (heat < 0.92) return `rgba(255, 20, 20, 1)`                       // hot red
  return '#FFFFFF'                                                      // white hot
}

/** Solid hex version for text rendering */
function thermalHex(heat: number): string {
  if (heat < 0.15) return '#1A0A50'
  if (heat < 0.3) return '#2814B4'
  if (heat < 0.45) return '#00B478'
  if (heat < 0.6) return '#C8C800'
  if (heat < 0.8) return '#FF5000'
  if (heat < 0.92) return '#FF1414'
  return '#FFFFFF'
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Drifting thermal convection blobs
    const blobCount = 12
    const blobs: React.ReactNode[] = []
    for (let i = 0; i < blobCount; i++) {
      const seed = i * 73 + 19
      const bx = (rand(seed) * width + Math.sin(time * 0.4 + i * 1.1) * 60) % width
      const by = (rand(seed + 1) * height + Math.cos(time * 0.3 + i * 0.8) * 40) % height
      const blobHeat = 0.1 + rand(seed + 2) * 0.35
      const blobSize = 40 + rand(seed + 3) * 80
      blobs.push(
        <div
          key={`blob-${i}`}
          style={{
            position: 'absolute',
            left: bx - blobSize / 2,
            top: by - blobSize / 2,
            width: blobSize,
            height: blobSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${thermalColor(blobHeat)} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />,
      )
    }

    // Temperature scale bar (right edge)
    const scaleGradient =
      'linear-gradient(to top, #1A0A50, #2814B4, #00B478, #C8C800, #FF5000, #FF1414, #FFFFFF)'

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Thermal noise grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              ${45 + Math.sin(time * 2) * 10}deg,
              transparent,
              transparent 2px,
              rgba(255,100,0,0.015) 2px,
              rgba(255,100,0,0.015) 3px
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* Convection blobs */}
        {blobs}

        {/* Scan line (slow horizontal sweep) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: ((time * 40) % (height * 1.2)) - height * 0.1,
            height: 2,
            background:
              'linear-gradient(90deg, transparent 5%, rgba(255,200,0,0.12) 30%, rgba(255,200,0,0.2) 50%, rgba(255,200,0,0.12) 70%, transparent 95%)',
            pointerEvents: 'none',
          }}
        />

        {/* Temperature scale bar */}
        <div
          style={{
            position: 'absolute',
            right: 10,
            top: '15%',
            bottom: '15%',
            width: 8,
            borderRadius: 4,
            background: scaleGradient,
            opacity: 0.6,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 22,
            top: '14%',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {'\u00b0'}C
        </div>

        {/* Crosshair reticle */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 40,
            height: 40,
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(50% - 24px)',
            width: 1,
            height: 10,
            background: 'rgba(255,255,255,0.2)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(50% + 14px)',
            width: 1,
            height: 10,
            background: 'rgba(255,255,255,0.2)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Camera label */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1,
          }}
        >
          FLIR &bull; THERMAL
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
    const seed = index * 97 + 41

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charSeed = seed + ci * 53
          const thermalMass = 0.7 + rand(charSeed) * 0.3 // heavier chars heat slower
          const charDelay = (ci / (totalChars + 1)) * 0.25

          let heat = 0
          let shimmerY = 0
          let charOpacity = 0
          let glowSize = 0

          if (phase === 'enter') {
            // Heat up: cold blue -> white hot, per-char stagger
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            heat = easeInOutCubic(p) * thermalMass
            charOpacity = Math.min(1, p * 2.5)
            glowSize = heat * 20
            // Rising heat convection shimmer during warm-up
            shimmerY = heat > 0.3 ? Math.sin(f * 0.2 + ci * 1.7) * heat * 2 : 0
          } else if (phase === 'hold') {
            // Pulsing between red-hot and white-hot, convection shimmer
            const breathe = Math.sin(holdProgress * Math.PI * 5 + ci * 0.9) * 0.12
            heat = 0.78 + breathe + rand(charSeed + f) * 0.05
            charOpacity = 1
            glowSize = 15 + Math.sin(holdProgress * Math.PI * 3 + ci) * 6
            shimmerY = Math.sin(f * 0.15 + ci * 1.3) * 2.5
          } else {
            // Cool down: white -> red -> yellow -> blue -> gone, per-char stagger
            const p = Math.max(
              0,
              Math.min(1, (exitProgress - charDelay * 0.4) / (1 - charDelay * 0.3)),
            )
            heat = Math.max(0, (1 - easeOutQuart(p)) * thermalMass)
            charOpacity = Math.max(0, 1 - easeOutQuart(p) * 1.2)
            glowSize = heat * 15
            shimmerY = heat > 0.2 ? Math.sin(f * 0.18 + ci * 1.5) * heat * 1.5 : 0
          }

          const charColor = thermalHex(heat)
          const glowColor = thermalHex(Math.min(1, heat + 0.1))

          // Temperature readout per character during hold
          const showTemp = phase === 'hold' && ci === Math.floor(totalChars / 2)
          const tempValue = Math.round(200 + heat * 600)

          return (
            <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
              {/* Heat radiation halo */}
              {heat > 0.4 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 50 + glowSize * 3,
                    height: 50 + glowSize * 3,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, ${glowColor}25 0%, transparent 70%)`,
                    filter: 'blur(12px)',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Cold-layer outline (visible when partially heated) */}
              {heat > 0.05 && heat < 0.7 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Roboto Mono', 'Courier New', monospace",
                    fontSize: 'clamp(42px, 12vw, 150px)',
                    fontWeight: 800,
                    color: 'transparent',
                    WebkitTextStroke: `1px ${thermalHex(heat * 0.5)}88`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
              )}

              {/* Main character — thermal colored */}
              <span
                style={{
                  fontFamily: "'Roboto Mono', 'Courier New', monospace",
                  fontSize: 'clamp(42px, 12vw, 150px)',
                  fontWeight: 800,
                  color: charColor,
                  opacity: charOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  transform: `translateY(${shimmerY}px)`,
                  textShadow:
                    heat > 0.5
                      ? `0 0 ${glowSize * 0.5}px ${glowColor}, 0 0 ${glowSize}px ${glowColor}80, 0 0 ${glowSize * 2}px ${glowColor}30`
                      : 'none',
                }}
              >
                {ch}
              </span>

              {/* Center-character temperature readout */}
              {showTemp && (
                <div
                  style={{
                    position: 'absolute',
                    top: -18,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: "'Courier New', monospace",
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.55)',
                    whiteSpace: 'nowrap',
                    letterSpacing: 1,
                  }}
                >
                  {tempValue}{'\u00b0'}C
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function ThermalCameraComponent(props: MotionGraphicProps<ThermalCameraConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thermal-camera',
  title: 'Kinetic Thermal Camera',
  description:
    'FLIR thermal imaging camera: characters heat up from cold blue through green/yellow/red to white-hot. Drifting convection blobs, temperature scale bar, crosshair reticle, and scan-line noise.',
  tags: [
    'kinetic',
    'typography',
    'thermal',
    'infrared',
    'flir',
    'heat',
    'camera',
    'temperature',
    'scan',
    'science',
  ],
  category: 'captions',
  component: ThermalCameraComponent as any,
  defaultConfig: {
    words: ['HEAT', 'SCAN', 'WARM', 'FIRE'],
    colors: ['#FF3300', '#FFAA00', '#FF5500', '#FFFFFF'],
    bgColor: '#0A0412',
    cycleDuration: 1.4,
    heatIntensity: 80,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HEAT', 'SCAN', 'WARM', 'FIRE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3300', '#FFAA00', '#FF5500', '#FFFFFF'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#0A0412',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'heatIntensity',
      label: 'Heat Intensity',
      type: 'number',
      defaultValue: 80,
      min: 0,
      max: 100,
      group: 'Animation',
    },
  ],
})
