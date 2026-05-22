import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThermalVisionConfig extends KineticBaseConfig {}

function thermalColor(heat: number): string {
  // Maps 0..1 heat to cold-blue -> green -> yellow -> red -> white
  if (heat < 0.2) {
    const t = heat / 0.2
    const r = Math.round(t * 20)
    const g = Math.round(t * 40)
    const b = Math.round(80 + t * 100)
    return `rgb(${r},${g},${b})`
  } else if (heat < 0.4) {
    const t = (heat - 0.2) / 0.2
    return `rgb(${Math.round(20 + t * 30)},${Math.round(40 + t * 180)},${Math.round(180 - t * 80)})`
  } else if (heat < 0.6) {
    const t = (heat - 0.4) / 0.2
    return `rgb(${Math.round(50 + t * 205)},${Math.round(220 - t * 20)},${Math.round(100 - t * 80)})`
  } else if (heat < 0.8) {
    const t = (heat - 0.6) / 0.2
    return `rgb(255,${Math.round(200 - t * 150)},${Math.round(20 + t * 10)})`
  } else {
    const t = (heat - 0.8) / 0.2
    return `rgb(255,${Math.round(50 + t * 205)},${Math.round(30 + t * 225)})`
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Thermal noise grid
    const cols = 16
    const rows = 12
    const cellW = width / cols
    const cellH = height / rows
    const cells: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * cols + c
        const baseHeat = 0.05 + ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1 * 0.15
        const flicker = Math.sin(time * 2 + seed * 0.7) * 0.03
        const heat = Math.max(0, Math.min(1, baseHeat + flicker))
        cells.push(
          <div
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW + 1,
              height: cellH + 1,
              background: thermalColor(heat),
              opacity: 0.35,
            }}
          />
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#0a0020' }}>
        {cells}
        {/* Scanline overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)`,
            pointerEvents: 'none',
          }}
        />
        {/* THERMAL label */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 2,
          }}
        >
          THERMAL IR
        </div>
        {/* Temp scale bar */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: '20%',
            bottom: '20%',
            width: 8,
            borderRadius: 4,
            background: 'linear-gradient(180deg, #FFFFFF, #FF4444, #FFAA00, #44FF44, #2244FF, #000066)',
            opacity: 0.6,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    if (phase === 'enter') {
      // Text heats up from cold blue to full color
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (chars.length + 1) * 0.3
            const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.7))
            // Heat ramps from 0 (cold) to 1 (hot)
            const heat = charT
            const charColor = thermalColor(heat)
            const glowRadius = Math.round(heat * 20)
            const charOpacity = Math.min(1, charT * 2.5)

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(44px, 12vw, 150px)',
                  fontWeight: 900,
                  color: charColor,
                  textShadow: `0 0 ${glowRadius}px ${charColor}, 0 0 ${glowRadius * 2}px ${charColor}66`,
                  opacity: charOpacity,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Full heat with pulsing thermal glow
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const heatFlicker = 0.75 + Math.sin(holdProgress * Math.PI * 6 + ci * 1.2) * 0.25
            const charColor = thermalColor(heatFlicker)
            const glowPulse = 15 + Math.sin(holdProgress * Math.PI * 4 + ci) * 8

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(44px, 12vw, 150px)',
                  fontWeight: 900,
                  color: charColor,
                  textShadow: `0 0 ${glowPulse}px ${charColor}, 0 0 ${glowPulse * 2}px ${charColor}55`,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else {
      // Cool down: hot -> cold -> disappear
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (chars.length + 1) * 0.3
            const charT = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))
            const heat = Math.max(0, 1 - charT * 1.2)
            const charColor = thermalColor(heat)
            const glowRadius = Math.round(heat * 15)
            const charOpacity = Math.max(0, 1 - charT * 1.3)

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(44px, 12vw, 150px)',
                  fontWeight: 900,
                  color: charColor,
                  textShadow: `0 0 ${glowRadius}px ${charColor}, 0 0 ${glowRadius * 2}px ${charColor}44`,
                  opacity: charOpacity,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function ThermalVisionComponent(props: MotionGraphicProps<ThermalVisionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thermal-vision',
  title: 'Kinetic Thermal Vision',
  description: 'Thermal camera view with text heating up from cold blue through green/yellow to hot red/white, scanline overlay, and thermal noise grid',
  tags: ['kinetic', 'typography', 'thermal', 'infrared', 'heat', 'camera', 'vision', 'scan'],
  category: 'captions',
  component: ThermalVisionComponent as any,
  defaultConfig: {
    words: ['HEAT', 'SCAN', 'WARM', 'GLOW'],
    colors: ['#FF4444', '#FFAA00', '#FF6600', '#FF2200'],
    bgColor: '#0a0020',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEAT', 'SCAN', 'WARM', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FFAA00', '#FF6600', '#FF2200'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0020', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
