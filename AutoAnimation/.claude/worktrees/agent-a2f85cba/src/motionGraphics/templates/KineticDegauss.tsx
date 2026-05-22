import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DegaussConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Eased degauss pulse — rapidly decaying sinusoid */
function degaussPulse(t: number, freq: number, decay: number): number {
  return Math.sin(t * freq) * Math.exp(-t * decay)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Degauss cycle: 2s period, rainbow wash at start then settles
    const cycleT = time % 2.0
    const active = cycleT < 1.2
    const intensity = active ? Math.max(0, 1 - cycleT / 1.2) : 0
    const wobble = degaussPulse(cycleT * 0.8, 12, 5)

    // Rainbow bands shimmer across screen during degauss
    const hueShift = (time * 80) % 360
    const bandHeight = 20 + wobble * 15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Magnetic rainbow wash — multiple color bands */}
        {active && Array.from({ length: 7 }, (_, i) => {
          const hue = (hueShift + i * 51 + wobble * 30) % 360
          const yPos = ((i / 7) * 100 + wobble * 8 + Math.sin(cycleT * 6 + i * 0.7) * 5)
          const alpha = intensity * (0.06 + rand(i * 17 + Math.floor(cycleT * 8)) * 0.08)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${yPos}%`,
                height: bandHeight,
                background: `linear-gradient(0deg, transparent, hsla(${hue},100%,60%,${alpha}), transparent)`,
                filter: 'blur(2px)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Central magnetic ripple — circular distortion field */}
        {active && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%)`,
              width: `${30 + intensity * 70}%`,
              height: `${30 + intensity * 70}%`,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center,
                hsla(${hueShift},80%,50%,${intensity * 0.04}) 0%,
                transparent 60%
              )`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Settled state — faint green tint (healthy CRT phosphor) */}
        {!active && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% 50%, rgba(0,80,20,0.04) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Scan lines — CRT context */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.12) 1px, rgba(0,0,0,0.12) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const fp = fps ?? 30
    const time = f / fp
    const seed = index * 107 + 61

    // Degauss warping applied to text
    // During enter: heavy magnetic warping that decays to settled text
    let warpX = 0
    let warpY = 0
    let hueRotate = 0
    let saturation = 100
    let opacity = 1
    let scaleX = 1

    if (phase === 'enter') {
      const t = enterProgress
      // Decaying oscillation — the degauss coil discharge waveform
      const pulse = degaussPulse(t * 1.5, 14, 8)
      warpX = pulse * 35 * (seed % 2 === 0 ? 1 : -1)
      warpY = degaussPulse(t * 1.2 + 0.3, 10, 7) * 20
      hueRotate = (1 - t) * (seed % 360)
      saturation = 100 + (1 - t) * 200
      scaleX = 1 + Math.abs(pulse) * 0.2
      opacity = 0.4 + t * 0.6
    } else if (phase === 'hold') {
      // Settled — minimal wobble
      warpX = Math.sin(holdProgress * Math.PI * 4 + seed) * 0.6
      opacity = 1
    } else {
      // Exit: brief re-magnetize flash
      const pulse = degaussPulse(exitProgress * 1.0, 8, 6)
      warpX = pulse * 20 * (seed % 2 === 0 ? 1 : -1)
      hueRotate = exitProgress * 120
      opacity = 1 - exitProgress * 0.9
    }

    const filterParts: string[] = []
    if (Math.abs(hueRotate) > 0.5) filterParts.push(`hue-rotate(${hueRotate}deg)`)
    if (saturation !== 100) filterParts.push(`saturate(${saturation}%)`)
    const filterStr = filterParts.length > 0 ? filterParts.join(' ') : undefined

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${warpX}px), calc(-50% + ${warpY}px)) scaleX(${scaleX})`,
          opacity,
          filter: filterStr,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 6,
          textShadow: `0 0 8px ${color}50`,
        }}
      >
        {word}
      </div>
    )
  },
}

function DegaussComponent(props: MotionGraphicProps<DegaussConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-degauss',
  title: 'Kinetic Degauss',
  description: 'CRT degauss coil discharge — rainbow magnetic warping ripples through text as the decaying electromagnetic field settles to a clean display',
  tags: ['kinetic', 'typography', 'degauss', 'crt', 'magnetic', 'rainbow', 'display', 'hardware', 'retro'],
  category: 'captions',
  component: DegaussComponent as any,
  defaultConfig: {
    words: ['DEGAUSS', 'RESET', 'CLEAR', 'SETTLE'],
    colors: ['#00ff80', '#80ff00', '#00ff80', '#40ff40'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEGAUSS', 'RESET', 'CLEAR', 'SETTLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ff80', '#80ff00', '#00ff80', '#40ff40'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
