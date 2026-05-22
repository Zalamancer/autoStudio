import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Wave Distortion 3: Underwater Caustic ────────────────────────────────────
// Text distorts as if seen through moving water — caustic light patterns,
// refractive shifting, bubble rise on hold.

interface UnderwaterCausticConfig extends KineticBaseConfig {
  depthFactor: number
  currentSpeed: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 63.7 + 19.2) * 43758.5453
  return x - Math.floor(x)
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
      {/* Water caustic light rays */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: 0,
          left: `${10 + i * 11}%`,
          width: `${2 + seeded(i * 5) * 4}%`,
          height: '100%',
          background: `linear-gradient(to bottom, rgba(100,200,255,0.06) 0%, transparent 70%)`,
          transform: `skewX(${(seeded(i * 7) - 0.5) * 20}deg)`,
          filter: 'blur(8px)',
        }} />
      ))}
      {/* Deep gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 20%, rgba(0,150,255,0.15) 0%, transparent 70%)`,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const t = holdProgress
    const CAUSTIC_COUNT = 6

    // Caustic light patches
    const caustics = Array.from({ length: CAUSTIC_COUNT }, (_, i) => {
      const cx = 20 + seeded(i * 11) * 60
      const cy = 20 + seeded(i * 7) * 60
      const drift = Math.sin(t * Math.PI * 2 + i * 1.4) * 5
      const pOp = 0.06 + Math.sin(t * Math.PI * 3 + i * 0.9) * 0.04
      return (
        <div key={i} style={{
          position: 'absolute',
          left: `${cx + drift}%`,
          top: `${cy + drift * 0.7}%`,
          width: `${8 + seeded(i * 3) * 12}%`,
          height: `${6 + seeded(i * 9) * 8}%`,
          borderRadius: '50%',
          background: `rgba(100,220,255,${pOp})`,
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }} />
      )
    })

    // Bubbles during hold
    const bubbles = phase === 'hold'
      ? Array.from({ length: 5 }, (_, i) => {
          const bx = 30 + seeded(i * 13) * 40
          const by = 100 - (holdProgress * 100 * (0.5 + seeded(i * 7) * 0.8) + seeded(i * 3) * 20) % 110
          const bOp = Math.max(0, Math.min(0.6, (by / 100) * 2))
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${bx}%`,
              top: `${by}%`,
              width: `${4 + seeded(i * 17) * 8}px`,
              height: `${4 + seeded(i * 17) * 8}px`,
              borderRadius: '50%',
              border: '1px solid rgba(100,220,255,0.4)',
              background: 'rgba(100,220,255,0.05)',
              opacity: bOp,
            }} />
          )
        })
      : []

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {caustics}
        {bubbles}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', whiteSpace: 'nowrap',
        }}>
          {chars.map((ch, ci) => {
            const norm = chars.length > 1 ? ci / (chars.length - 1) : 0.5

            // Refractive distortion — complex 2-axis sine waves
            const waveX = Math.sin(t * Math.PI * 2.5 + ci * 0.8) * 4
            const waveY = Math.sin(t * Math.PI * 3.2 + ci * 1.1 + 1) * 6
            const rot = Math.sin(t * Math.PI * 2 + ci * 0.6) * 3
            const scX = 1 + Math.sin(t * Math.PI * 3 + ci * 0.7) * 0.06
            const scY = 1 + Math.cos(t * Math.PI * 2.8 + ci * 0.9) * 0.08

            let tx = waveX, ty = waveY, tRot = rot, tScX = scX, tScY = scY, op = 0, blur = 0

            if (phase === 'enter') {
              const p = easeOutCubic(Math.max(0, (enterProgress - norm * 0.2) / 0.8))
              op = Math.min(1, p * 2)
              ty += (1 - p) * 80
              blur = (1 - p) * 8
              tScX = 0.5 + p * 0.5
              tScY = 0.5 + p * 0.5
            } else if (phase === 'hold') {
              op = 1
            } else {
              const p = easeInCubic(exitProgress)
              op = 1 - p
              ty += p * -50
              blur = p * 12
            }

            return (
              <div
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
                  fontSize: 'clamp(42px, 10vw, 136px)',
                  fontWeight: 700,
                  color,
                  opacity: op,
                  filter: `blur(${blur}px)`,
                  transform: `translate(${tx}px, ${ty}px) rotate(${tRot}deg) scaleX(${tScX}) scaleY(${tScY})`,
                  textShadow: `0 0 20px rgba(0,200,255,0.5), 0 0 40px rgba(0,100,200,0.3)`,
                  lineHeight: 1.1,
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}

function UnderwaterCausticComponent(props: MotionGraphicProps<UnderwaterCausticConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-underwater-caustic',
  title: 'Kinetic Underwater Caustic',
  description: 'Text seen through moving water — refractive 2-axis distortion, caustic light patches, and rising bubbles during hold. Enter drifts up from depth, exit dissolves upward.',
  tags: ['kinetic', 'typography', 'underwater', 'caustic', 'wave', 'water', 'distortion', 'refraction'],
  category: 'captions',
  component: UnderwaterCausticComponent as any,
  defaultConfig: {
    words: ['DEEP', 'FLOW', 'WAVE', 'DIVE'],
    colors: ['#00FFFF', '#FFFFFF', '#00DDFF', '#88FFEE'],
    bgColor: '#001428',
    cycleDuration: 2.2,
    depthFactor: 1,
    currentSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEEP', 'FLOW', 'WAVE', 'DIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FFFFFF', '#00DDFF', '#88FFEE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#001428', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.8, max: 6, group: 'Timing' },
    { key: 'depthFactor', label: 'Depth Factor', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
    { key: 'currentSpeed', label: 'Current Speed', type: 'number', defaultValue: 1, min: 0.2, max: 4, group: 'Animation' },
  ],
})
