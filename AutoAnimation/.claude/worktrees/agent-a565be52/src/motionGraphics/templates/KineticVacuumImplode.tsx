import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Compression/Expansion 2: Vacuum Implode ──────────────────────────────────
// Text implodes inward as if a vacuum is sucking all matter to the center,
// then pops back out in an explosive decompression.

interface VacuumImplodeConfig extends KineticBaseConfig {
  vacuumStrength: number
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (Math.PI * 2) / 3) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 50%, rgba(200,100,255,0.06) 0%, transparent 60%)`,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Vacuum pulse ring (for enter pop)
    let vacRingScale = 0, vacRingOp = 0
    if (phase === 'enter' && enterProgress > 0.5) {
      const p = (enterProgress - 0.5) / 0.5
      vacRingScale = p * 3
      vacRingOp = Math.max(0, 1 - p)
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Decompression ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 100, height: 60,
          marginLeft: -50, marginTop: -30,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          transform: `scale(${vacRingScale})`,
          opacity: vacRingOp * 0.8,
          pointerEvents: 'none',
          filter: 'blur(1px)',
        }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', whiteSpace: 'nowrap',
        }}>
          {chars.map((ch, ci) => {
            const centerIdx = (totalChars - 1) / 2
            const dist = ci - centerIdx
            const normDist = totalChars > 1 ? dist / centerIdx : 0

            let tx = 0, ty = 0, sc = 1, op = 0, rot = 0, blur = 0

            if (phase === 'enter') {
              if (enterProgress < 0.45) {
                // All chars implode to center
                const p = easeInExpo(enterProgress / 0.45)
                tx = -normDist * width * 0.35 * p
                ty = 0
                sc = Math.max(0.02, 1 - p * 0.98)
                op = Math.max(0.1, 1 - p * 0.8)
                blur = p * 15
              } else {
                // BOOM — elastic explosion outward
                const p = (enterProgress - 0.45) / 0.55
                const e = easeOutElastic(p)
                tx = normDist * width * 0.03 * Math.sin(e * Math.PI * 3) * (1 - e * 0.3)
                sc = e * 1.05
                op = Math.min(1, p * 2)
                blur = Math.max(0, (1 - p) * 8)
              }
            } else if (phase === 'hold') {
              // Breathing pulsation
              const pulse = Math.sin(holdProgress * Math.PI * 3 + ci * 0.4) * 0.025
              sc = 1 + pulse
              ty = Math.sin(holdProgress * Math.PI * 4 + ci * 0.7) * 2
              op = 1
            } else {
              // Re-implode
              const p = easeInCubic(exitProgress)
              tx = -normDist * width * 0.4 * p
              sc = Math.max(0.01, 1 - p * 0.98)
              op = 1 - p * 0.7
              blur = p * 12
            }

            return (
              <div
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif",
                  fontSize: 'clamp(46px, 11vw, 144px)',
                  fontWeight: 900,
                  color,
                  opacity: op,
                  filter: `blur(${blur}px)`,
                  transform: `translateX(${tx}px) translateY(${ty}px) scale(${sc}) rotate(${rot}deg)`,
                  transformOrigin: 'center center',
                  textShadow: `0 0 30px ${color}60`,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
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

function VacuumImplodeComponent(props: MotionGraphicProps<VacuumImplodeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vacuum-implode',
  title: 'Kinetic Vacuum Implode',
  description: 'Text implodes to a singularity point (scale→0), then decompresses with elastic explosion and a ring pulse — alive pulsation during hold.',
  tags: ['kinetic', 'typography', 'vacuum', 'implode', 'compression', 'explode', 'singularity', 'elastic'],
  category: 'captions',
  component: VacuumImplodeComponent as any,
  defaultConfig: {
    words: ['VOID', 'SUCK', 'POP', 'BOOM'],
    colors: ['#CC44FF', '#FFFFFF', '#8844FF', '#FF44CC'],
    bgColor: '#080012',
    cycleDuration: 1.4,
    vacuumStrength: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOID', 'SUCK', 'POP', 'BOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC44FF', '#FFFFFF', '#8844FF', '#FF44CC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080012', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'vacuumStrength', label: 'Vacuum Strength', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
