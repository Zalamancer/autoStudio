import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThermalScanConfig extends KineticBaseConfig {}

/** Thermal color ramp: cold=purple→blue → warm=green → hot=yellow→red→white */
function thermalColor(t: number): string {
  // t: 0=coldest (deep purple/blue) … 1=hottest (white)
  if (t < 0.2) {
    const u = t / 0.2
    const r = Math.round(30 + u * 20)
    const g = Math.round(0 + u * 20)
    const b = Math.round(80 + u * 100)
    return `rgb(${r},${g},${b})`
  } else if (t < 0.45) {
    const u = (t - 0.2) / 0.25
    const r = Math.round(50 + u * 0)
    const g = Math.round(20 + u * 180)
    const b = Math.round(180 - u * 180)
    return `rgb(${r},${g},${b})`
  } else if (t < 0.65) {
    const u = (t - 0.45) / 0.2
    const r = Math.round(50 + u * 200)
    const g = Math.round(200 - u * 0)
    const b = Math.round(0)
    return `rgb(${r},${g},${b})`
  } else if (t < 0.85) {
    const u = (t - 0.65) / 0.2
    const r = 255
    const g = Math.round(200 - u * 180)
    const b = 0
    return `rgb(${r},${g},${b})`
  } else {
    const u = (t - 0.85) / 0.15
    return `rgb(255,${Math.round(20 + u * 235)},${Math.round(u * 255)})`
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Slow thermal camera scan pan from left to right
    const time = frame / fps
    const scanX = ((time * 0.3) % 1.3 - 0.15) * width

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Thermal noise texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30,0,60,0.6) 0%, transparent 100%)',
        }} />
        {/* Horizontal scanline texture (thermal camera sensor lines) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
        }} />
        {/* Moving thermal sweep bar */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: scanX, width: 40,
          background: 'linear-gradient(90deg, transparent, rgba(255,120,0,0.08), rgba(255,200,0,0.15), rgba(255,120,0,0.08), transparent)',
          filter: 'blur(8px)',
        }} />
        {/* Temperature scale bar on right edge */}
        <div style={{
          position: 'absolute', right: 16, top: '15%', bottom: '15%', width: 8,
          background: 'linear-gradient(180deg, white, #FF2200, #FFAA00, #00BB00, #0000CC, #220066)',
          borderRadius: 4, opacity: 0.5,
        }} />
        <div style={{ position: 'absolute', right: 28, top: '14%', fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>HOT</div>
        <div style={{ position: 'absolute', right: 28, bottom: '13%', fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>COLD</div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Thermal sweep reveals text from left to right
    // Each character heats up from cold (purple) → hot (yellow/white) then settles to warm
    const chars = word.split('')

    if (phase === 'enter') {
      // Sweep moves left-to-right; each char goes cold→hot as sweep passes
      const sweepPos = enterProgress // 0..1 across word width
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 155px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          display: 'flex',
        }}>
          {chars.map((ch, ci) => {
            const charFrac = (ci + 0.5) / chars.length
            const delta = sweepPos - charFrac
            // Before sweep: cold/invisible; at sweep: peak heat; after: settling warm
            let heat: number
            let opacity: number
            if (delta < 0) {
              heat = 0.05
              opacity = 0
            } else if (delta < 0.15) {
              heat = 0.6 + (delta / 0.15) * 0.4 // ramps to white-hot
              opacity = delta / 0.15
            } else {
              heat = Math.max(0.55, 1 - (delta - 0.15) / 0.5) // cools toward warm orange
              opacity = 1
            }
            const tc = thermalColor(heat)
            return (
              <span key={ci} style={{
                color: tc,
                opacity,
                textShadow: heat > 0.7 ? `0 0 20px ${tc}, 0 0 40px rgba(255,200,0,0.4)` : `0 0 8px ${tc}50`,
                filter: heat > 0.8 ? 'brightness(1.3)' : 'none',
              }}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Text glows warm orange-yellow with subtle heat shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 6) * 0.04
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scaleY(${1 + shimmer})`,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 155px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          display: 'flex',
        }}>
          {chars.map((ch, ci) => {
            const offset = ci / Math.max(1, chars.length - 1)
            // Settled: warm band from orange-yellow
            const baseHeat = 0.58 + offset * 0.08 + Math.sin(holdProgress * Math.PI * 4 + ci) * 0.03
            const tc = thermalColor(baseHeat)
            return (
              <span key={ci} style={{
                color: tc,
                textShadow: `0 0 12px ${tc}80`,
              }}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else {
      // Cool down: chars shift to cold blue, fade out
      const cooldown = exitProgress
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 155px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          display: 'flex',
          opacity: 1 - cooldown,
        }}>
          {chars.map((ch, ci) => {
            const baseHeat = Math.max(0.05, 0.58 - cooldown * 0.55)
            const tc = thermalColor(baseHeat)
            return (
              <span key={ci} style={{ color: tc }}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function ThermalScanComponent(props: MotionGraphicProps<ThermalScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thermal-scan',
  title: 'Kinetic Thermal Scan',
  description: 'Thermal camera sweep reveals text through a heat-signature color ramp — cold purple/blue to white-hot, settling to warm orange',
  tags: ['kinetic', 'typography', 'thermal', 'infrared', 'heat', 'scan', 'camera', 'temperature'],
  category: 'captions',
  component: ThermalScanComponent as any,
  defaultConfig: {
    words: ['HEAT', 'WARM', 'HOT', 'FIRE'],
    colors: ['#FF8800', '#FFBB00', '#FF6600', '#FFDD00'],
    bgColor: '#06000e',
    cycleDuration: 1.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEAT', 'WARM', 'HOT', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF8800', '#FFBB00', '#FF6600', '#FFDD00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06000e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.7, min: 0.3, max: 5, group: 'Timing' },
  ],
})
