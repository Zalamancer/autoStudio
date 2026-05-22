import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Wave Distortion 2: Heat Mirage ────────────────────────────────────────────
// Text wavers with heat-haze distortion — multiple offset copies with opacity
// layering simulate hot-air shimmering. Characters individually deform.

interface HeatMirageConfig extends KineticBaseConfig {
  heatIntensity: number
  mirageHeight: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Horizon shimmer line */}
      <div
        style={{
          position: 'absolute',
          bottom: '35%',
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(to right, transparent, rgba(255,200,100,0.15), transparent)`,
          filter: 'blur(2px)',
        }}
      />
      {/* Heat gradient from bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(to top, rgba(255,140,0,0.06) 0%, transparent 100%)`,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const GHOST_LAYERS = 4
    const heatClock = holdProgress * Math.PI * 3

    // Render multiple ghost/mirage layers
    const layers = Array.from({ length: GHOST_LAYERS + 1 }, (_, layerIdx) => {
      const isMain = layerIdx === GHOST_LAYERS
      const ghostNorm = layerIdx / GHOST_LAYERS // 0=deepest ghost, ...→ main

      let globalOp = 1
      if (phase === 'enter') {
        globalOp = easeOutCubic(Math.max(0, (enterProgress - ghostNorm * 0.2) / 0.8))
      } else if (phase === 'exit') {
        globalOp = Math.max(0, 1 - easeInCubic((exitProgress - (1 - ghostNorm) * 0.2) / 0.8))
      }

      return (
        <div
          key={layerIdx}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {chars.map((ch, ci) => {
            const totalChars2 = chars.length
            const norm = totalChars2 > 1 ? ci / (totalChars2 - 1) : 0.5

            // Per-char mirage offset
            const mirageOffset = Math.sin(heatClock + ci * 0.7 + layerIdx * 1.2) * 8 * (1 - ghostNorm)
            const lateralDrift = Math.sin(heatClock * 1.3 + ci * 0.9 + layerIdx * 0.8) * 4 * (1 - ghostNorm)

            // Ghost layers are below (higher y = mirage reflection)
            const layerY = isMain ? 0 : (GHOST_LAYERS - layerIdx) * 12
            const layerOpacity = isMain ? 1 : Math.max(0, 0.35 - ghostNorm * 0.3)
            const layerBlur = isMain ? 0 : (GHOST_LAYERS - layerIdx) * 1.5

            // Vertical squish of ghost (mirage is flattened)
            const scaleY = isMain ? 1 : 0.8 - (GHOST_LAYERS - layerIdx) * 0.12

            // Individual char heat wobble
            let charX = lateralDrift,
              charY = mirageOffset,
              charRot = 0,
              charSc = 1
            if (!isMain) {
              charY += layerY
            }

            if (phase === 'enter') {
              const p = Math.max(0, Math.min(1, (enterProgress - (isMain ? 0 : 0.1)) / 0.9))
              charSc = 0.3 + easeOutCubic(p) * 0.7 + (isMain ? 0 : 0)
              charY += (1 - easeOutCubic(p)) * 30
            } else if (phase === 'hold') {
              charRot = Math.sin(heatClock * 0.7 + ci * 1.1) * 1.5
              charSc = 1 + Math.sin(heatClock + ci * 0.8) * 0.03
            } else {
              const p = easeInCubic(exitProgress)
              charSc = 1 - p * 0.5
              charY += p * -20
            }

            return (
              <div
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                  fontSize: 'clamp(44px, 10vw, 138px)',
                  fontWeight: 900,
                  color,
                  opacity: globalOp * layerOpacity,
                  filter: `blur(${layerBlur}px) ${isMain ? '' : 'saturate(1.4)'}`,
                  transform: `translateX(${charX}px) translateY(${charY}px) rotate(${charRot}deg) scaleX(${charSc}) scaleY(${scaleY})`,
                  transformOrigin: 'center bottom',
                  textShadow: isMain ? `0 0 20px ${color}50` : `0 ${layerY * 0.5}px ${layerBlur * 2}px ${color}30`,
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>
      )
    })

    return <div style={{ position: 'absolute', inset: 0 }}>{layers}</div>
  },
}

function HeatMirageComponent(props: MotionGraphicProps<HeatMirageConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-heat-mirage',
  title: 'Kinetic Heat Mirage',
  description:
    'Text shimmers with desert heat-haze — layered ghost copies below create a mirage reflection while per-character lateral and vertical wobble simulate hot-air distortion.',
  tags: ['kinetic', 'typography', 'heat', 'mirage', 'wave', 'distortion', 'shimmer', 'desert'],
  category: 'captions',
  component: HeatMirageComponent as any,
  defaultConfig: {
    words: ['HEAT', 'MIRAGE', 'HOT', 'GLOW'],
    colors: ['#FFD700', '#FF8C00', '#FFF0AA', '#FF6633'],
    bgColor: '#1a0800',
    cycleDuration: 2.0,
    heatIntensity: 1,
    mirageHeight: 30,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HEAT', 'MIRAGE', 'HOT', 'GLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FF8C00', '#FFF0AA', '#FF6633'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0800', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'heatIntensity',
      label: 'Heat Intensity',
      type: 'number',
      defaultValue: 1,
      min: 0.2,
      max: 3,
      group: 'Animation',
    },
    {
      key: 'mirageHeight',
      label: 'Mirage Height',
      type: 'number',
      defaultValue: 30,
      min: 5,
      max: 80,
      group: 'Animation',
    },
  ],
})
