import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Rotation Distort 2: DNA Twist ─────────────────────────────────────────────
// Characters twist along a double-helix axis — scaleX oscillates through
// perspective-foreshortening, half-behind are darker, simulating 3D rotation.

interface DNATwistConfig extends KineticBaseConfig {
  twistSpeed: number
  helixAmplitude: number
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
      {/* DNA helix connector lines (horizontal) */}
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${10 + i * 9}%`,
          left: '15%', right: '15%', height: 1,
          background: `rgba(100,200,100,0.05)`,
        }} />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Helix rotation clock — continuous during hold
    const helixAngle = holdProgress * Math.PI * 2.5

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Connector rungs between top and bottom strand */}
        {chars.map((_, ci) => {
          const norm = totalChars > 1 ? ci / (totalChars - 1) : 0.5
          const charWidth = width * 0.65 / Math.max(1, totalChars)
          const charX = width * 0.175 + norm * width * 0.65

          let rungOp = 0
          if (phase === 'enter') rungOp = Math.max(0, (enterProgress - 0.5) / 0.5) * 0.25
          else if (phase === 'hold') rungOp = 0.2 + Math.sin(helixAngle + ci * 0.5) * 0.05
          else rungOp = Math.max(0, 1 - exitProgress * 2) * 0.2

          const rungAngle = helixAngle + norm * Math.PI * 2
          const rungLength = 12 + Math.abs(Math.cos(rungAngle)) * 20

          return (
            <div key={ci} style={{
              position: 'absolute',
              left: charX - rungLength / 2,
              top: '50%',
              width: rungLength,
              height: 2,
              marginTop: -1,
              background: `rgba(100,255,100,${rungOp})`,
              borderRadius: 1,
            }} />
          )
        })}

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', whiteSpace: 'nowrap',
        }}>
          {chars.map((ch, ci) => {
            const norm = totalChars > 1 ? ci / (totalChars - 1) : 0.5
            // Helix phase per character — offset along the helix
            const helixPhaseOffset = norm * Math.PI * 2

            // The character's rotation angle in the helix
            const theta = helixAngle + helixPhaseOffset
            // Perspective foreshortening: scaleX oscillates with cos
            const helixScaleX = Math.cos(theta)
            // Y offset from helix sine wave
            const helixY = Math.sin(theta) * 20

            // Characters "facing away" are dimmer
            const facingForward = Math.cos(theta) > 0
            const dimFactor = facingForward ? 1 : 0.35

            let scX = helixScaleX, ty = helixY, op = 0, sc = 1, blur = 0

            if (phase === 'enter') {
              // Unwind into position from a tight helix
              const p = Math.max(0, Math.min(1, (enterProgress - norm * 0.25) / 0.75))
              const e = easeOutCubic(p)
              // Start with full spin visible
              const startTheta = theta - (1 - e) * Math.PI * 3
              scX = Math.cos(startTheta) * e + helixScaleX * e
              ty = Math.sin(startTheta) * 30 * (1 - e) + helixY * e
              op = Math.min(1, p * 2)
              sc = 0.3 + e * 0.7
              blur = (1 - e) * 6
            } else if (phase === 'hold') {
              scX = helixScaleX
              ty = helixY
              op = dimFactor
              sc = 1
            } else {
              // Wind back out
              const p = easeInCubic(exitProgress)
              const exitTheta = theta + p * Math.PI * 3
              scX = Math.cos(exitTheta) * (1 - p) + helixScaleX * (1 - p)
              ty = Math.sin(exitTheta) * 30 * p + helixY * (1 - p)
              op = dimFactor * (1 - p)
              sc = 1 - p * 0.5
              blur = p * 8
            }

            return (
              <div
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: 'clamp(44px, 10vw, 138px)',
                  fontWeight: 900,
                  color,
                  opacity: Math.max(0, op),
                  filter: `blur(${blur}px) brightness(${facingForward ? 1.2 : 0.5})`,
                  transform: `translateY(${ty}px) scale(${sc}) scaleX(${scX})`,
                  transformOrigin: 'center center',
                  textShadow: `0 0 15px ${color}40`,
                  lineHeight: 1,
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

function DNATwistComponent(props: MotionGraphicProps<DNATwistConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dna-twist',
  title: 'Kinetic DNA Twist',
  description: 'Characters rotate along a double-helix axis — perspective foreshortening via scaleX cos wave, dimmer when facing away, connector rungs between strand positions.',
  tags: ['kinetic', 'typography', 'dna', 'helix', 'rotation', 'twist', 'distortion', 'science'],
  category: 'captions',
  component: DNATwistComponent as any,
  defaultConfig: {
    words: ['TWIST', 'HELIX', 'SPIN', 'CODE'],
    colors: ['#00FF88', '#FFFFFF', '#00DDFF', '#88FF00'],
    bgColor: '#000c08',
    cycleDuration: 2.0,
    twistSpeed: 1,
    helixAmplitude: 20,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TWIST', 'HELIX', 'SPIN', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#FFFFFF', '#00DDFF', '#88FF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000c08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
    { key: 'twistSpeed', label: 'Twist Speed', type: 'number', defaultValue: 1, min: 0.2, max: 4, group: 'Animation' },
    { key: 'helixAmplitude', label: 'Helix Amplitude', type: 'number', defaultValue: 20, min: 5, max: 60, group: 'Animation' },
  ],
})
