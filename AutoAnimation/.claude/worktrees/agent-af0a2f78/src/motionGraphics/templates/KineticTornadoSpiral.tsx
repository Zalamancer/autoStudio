import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Rotation Distort 1: Tornado Spiral ────────────────────────────────────────
// Characters spiral in from a whirling vortex — each char rotates on a
// different orbit radius, funnel-converging to final position.

interface TornadoSpiralConfig extends KineticBaseConfig {
  spinSpeed: number
  funnelDepth: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Vortex rings */}
      {Array.from({ length: 5 }, (_, i) => {
        const r = 30 + i * 40
        return (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: r * 2, height: r * 2,
            marginLeft: -r, marginTop: -r,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.02 + i * 0.005})`,
          }} />
        )
      })}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const cx = width / 2
    const cy = height / 2

    // Ambient slow spin during hold
    const holdSpin = holdProgress * Math.PI * 2

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {chars.map((ch, ci) => {
          // Each char's final position in the word layout
          const charWidth = width / Math.max(totalChars, 1)
          const finalX = cx + (ci - (totalChars - 1) / 2) * charWidth * 0.65
          const finalY = cy

          // Stagger by char index for spiral
          const stagger = (ci / Math.max(1, totalChars - 1)) * 0.35
          // Orbit parameters — chars come from a tight spiral
          const orbitRadius = 200 + ci * 15
          const startAngle = (ci / totalChars) * Math.PI * 4 + Math.PI // start below/behind

          let renderX = finalX, renderY = finalY, rot = 0, sc = 1, op = 0, blur = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.6)))
            const e = easeOutBack(p)

            // Spiral path: orbit shrinks as it converges
            const orbitProgress = 1 - e
            const angle = startAngle + orbitProgress * Math.PI * 3 * (ci % 2 === 0 ? 1 : -1)
            const currentRadius = orbitRadius * orbitProgress

            renderX = cx + Math.cos(angle) * currentRadius * (1 - e) + finalX * e - cx * (1 - e)
            renderY = cy + Math.sin(angle) * currentRadius * 0.5 * (1 - e) + finalY * e - cy * (1 - e)

            rot = (1 - e) * (ci % 2 === 0 ? -720 : 720) * orbitProgress
            sc = 0.1 + e * 0.9
            op = Math.min(1, p * 2.5)
            blur = (1 - e) * 8
          } else if (phase === 'hold') {
            // Subtle spin of each char in place
            const wobble = Math.sin(holdSpin + ci * 0.7) * 4
            renderX = finalX + Math.cos(holdSpin * 0.5 + ci) * wobble * 0.3
            renderY = finalY + Math.sin(holdSpin * 0.7 + ci) * wobble
            rot = Math.sin(holdSpin + ci * 0.5) * 5
            sc = 1 + Math.sin(holdSpin * 1.5 + ci) * 0.02
            op = 1
          } else {
            // Unravel back into tornado
            const p = easeInCubic(exitProgress)
            const angle = startAngle + p * Math.PI * -4 * (ci % 2 === 0 ? 1 : -1)
            const currentRadius = orbitRadius * p

            renderX = finalX * (1 - p) + (cx + Math.cos(angle) * currentRadius) * p
            renderY = finalY * (1 - p) + (cy + Math.sin(angle) * currentRadius * 0.4 - height * p) * p

            rot = p * (ci % 2 === 0 ? 360 : -360)
            sc = 1 - p * 0.7
            op = 1 - p
          }

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                left: renderX,
                top: renderY,
                transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`,
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(44px, 10vw, 140px)',
                fontWeight: 900,
                color,
                opacity: op,
                filter: `blur(${blur}px)`,
                textShadow: `0 0 20px ${color}50`,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>
    )
  },
}

function TornadoSpiralComponent(props: MotionGraphicProps<TornadoSpiralConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tornado-spiral',
  title: 'Kinetic Tornado Spiral',
  description: 'Characters spiral in from a tornado vortex — alternating clockwise/counter-clockwise orbits converge to word position with elastic snap, gentle wobble on hold.',
  tags: ['kinetic', 'typography', 'tornado', 'spiral', 'rotation', 'vortex', 'distortion', 'orbit'],
  category: 'captions',
  component: TornadoSpiralComponent as any,
  defaultConfig: {
    words: ['SPIN', 'TWIRL', 'WHIRL', 'VORTEX'],
    colors: ['#FFFFFF', '#00DDFF', '#FFFFFF', '#FF6600'],
    bgColor: '#050a18',
    cycleDuration: 1.6,
    spinSpeed: 1,
    funnelDepth: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIN', 'TWIRL', 'WHIRL', 'VORTEX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00DDFF', '#FFFFFF', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050a18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.6, max: 5, group: 'Timing' },
    { key: 'spinSpeed', label: 'Spin Speed', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
    { key: 'funnelDepth', label: 'Funnel Depth', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
