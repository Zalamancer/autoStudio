import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Rotation Distort 3: Gear Teeth ────────────────────────────────────────────
// Characters are gear cogs that mesh and lock together — each rotates in
// opposite direction to its neighbors, interlocking like actual gears.

interface GearTeethConfig extends KineticBaseConfig {
  gearSpeed: number
  toothDepth: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Generate gear tooth clip-path
function gearClipPath(teeth: number, outerR: number, innerR: number): string {
  const points: string[] = []
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (i / (teeth * 4)) * Math.PI * 2
    const r = i % 4 < 2 ? outerR : innerR
    points.push(`${50 + Math.cos(angle) * r}% ${50 + Math.sin(angle) * r}%`)
  }
  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Metal grid lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${15 + i * 14}%`,
          height: 1,
          background: `rgba(200,200,200,0.03)`,
        }} />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Continuous gear rotation during hold
    const gearAngle = holdProgress * Math.PI * 4

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {chars.map((ch, ci) => {
          const norm = totalChars > 1 ? ci / (totalChars - 1) : 0.5
          // Gears alternate direction
          const direction = ci % 2 === 0 ? 1 : -1

          // Gear rotation — each meshes with neighbors (alternating)
          const baseRotation = gearAngle * direction * 180 / Math.PI

          let rot = 0, sc = 0, op = 0, tx = 0, blur = 0

          if (phase === 'enter') {
            // Gears spin in from off-screen, meshing as they arrive
            const delay = norm * 0.3
            const p = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay * 0.5)))
            const e = easeOutCubic(p)
            // Enter from above with a spin
            const startY = -height * 0.8
            tx = 0
            rot = baseRotation + direction * (1 - e) * 720
            sc = 0.1 + e * 0.9
            op = Math.min(1, p * 2.5)
            blur = (1 - e) * 10
          } else if (phase === 'hold') {
            rot = baseRotation
            sc = 1
            op = 1
          } else {
            // Gears spin out
            const p = easeInCubic(exitProgress)
            const delay = (1 - norm) * 0.2
            const pp = Math.max(0, Math.min(1, (exitProgress - delay) / (1 - delay)))
            rot = baseRotation + direction * pp * 540
            sc = 1 - pp * 0.8
            op = 1 - pp
            blur = pp * 8
          }

          // Gear visual: clip-path cog shape
          const clipPath = gearClipPath(8, 45, 35)

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${(norm * 0.7 + 0.15) * 100}%`,
                transform: `translate(-50%, -50%)`,
                width: `${Math.min(100 / totalChars, 16)}vw`,
                aspectRatio: '1',
                opacity: op,
              }}
            >
              {/* Gear cog backdrop */}
              <div style={{
                position: 'absolute',
                inset: 0,
                clipPath,
                background: `rgba(255,255,255,0.05)`,
                border: `2px solid ${color}30`,
                transform: `rotate(${rot}deg) scale(${sc})`,
                filter: `blur(${blur}px)`,
              }} />
              {/* Character */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(28px, 6vw, 90px)',
                fontWeight: 900,
                color,
                opacity: op,
                transform: `rotate(${rot * 0.1}deg) scale(${sc})`,
                filter: `blur(${blur * 0.5}px)`,
                textShadow: `0 0 10px ${color}50`,
                lineHeight: 1,
              }}>
                {ch}
              </div>
            </div>
          )
        })}
      </div>
    )
  },
}

function GearTeethComponent(props: MotionGraphicProps<GearTeethConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gear-teeth',
  title: 'Kinetic Gear Teeth',
  description: 'Each character is a meshing gear — alternating clockwise/counter rotation, cog clip-path backdrop, spins in from above and continues meshing during hold.',
  tags: ['kinetic', 'typography', 'gear', 'cog', 'rotation', 'mechanical', 'distortion', 'industrial'],
  category: 'captions',
  component: GearTeethComponent as any,
  defaultConfig: {
    words: ['GRIND', 'MESH', 'TURN', 'LOCK'],
    colors: ['#FFD700', '#BBBBBB', '#FFD700', '#FFFFFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
    gearSpeed: 1,
    toothDepth: 10,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRIND', 'MESH', 'TURN', 'LOCK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#BBBBBB', '#FFD700', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
    { key: 'gearSpeed', label: 'Gear Speed', type: 'number', defaultValue: 1, min: 0.2, max: 4, group: 'Animation' },
    { key: 'toothDepth', label: 'Tooth Depth', type: 'number', defaultValue: 10, min: 2, max: 20, group: 'Animation' },
  ],
})
