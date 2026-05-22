import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Tombstone Tilt -----------------------------------------------------------
// Each character tilts backward in perspective like stone monoliths or tombstones
// rising from the ground. Enter: letters rise from below and tilt back via rotateX.
// Hold: subtle wind-sway oscillation. Exit: tombstones topple forward and sink.

interface TombstoneTiltConfig extends KineticBaseConfig {
  tiltAngle: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Ground plane */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%',
          background: `linear-gradient(to top, rgba(40,50,35,0.4), transparent)`,
        }} />
        {/* Fog/mist drifting */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 120% 30% at ${50 + Math.sin(time * 0.3) * 10}% 75%, rgba(180,200,180,0.06), transparent)`,
          mixBlendMode: 'screen',
        }} />
        {/* Moonlight ray */}
        <div style={{
          position: 'absolute',
          top: 0, right: '15%',
          width: '30%', height: '100%',
          background: `linear-gradient(175deg, rgba(200,220,255,0.03), transparent 60%)`,
          opacity: 0.8 + Math.sin(time * 0.5) * 0.2,
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const tiltAngle = -25 // final backward tilt in degrees (negative = tilted back)

    const charElements = chars.map((ch, ci) => {
      const stagger = ci * 0.1
      const charEnter = Math.max(0, Math.min(1, (enterProgress - stagger) / Math.max(0.01, 1 - stagger * totalChars * 0.06)))
      const charExit = Math.max(0, Math.min(1, (exitProgress - ci * 0.06) / Math.max(0.01, 1 - (totalChars - 1) * 0.05)))

      let rotateX = -90 // start flat on the ground (face-up)
      let translateY = 60 // below ground
      let opacity = 0
      let scale = 0.8

      if (phase === 'enter') {
        const e = easeOutBounce(charEnter)
        const eSmooth = easeOutExpo(charEnter)
        rotateX = -90 + eSmooth * (90 + tiltAngle) // rise from flat to tilted-back
        translateY = 60 * (1 - e) // rise up with bounce
        opacity = charEnter > 0.05 ? 1 : 0
        scale = 0.8 + e * 0.2
      } else if (phase === 'hold') {
        rotateX = tiltAngle
        translateY = 0
        opacity = 1
        scale = 1
        // Wind sway -- each stone sways slightly at different phase
        const sway = Math.sin(holdProgress * Math.PI * 3 + ci * 1.3) * 2.5
        const creep = Math.sin(holdProgress * Math.PI * 5 + ci * 0.8) * 0.8
        rotateX = tiltAngle + sway
        translateY = creep
      } else {
        const e = easeInQuad(charExit)
        // Topple forward
        rotateX = tiltAngle + e * (90 - tiltAngle) // from tilt to face-down
        translateY = e * 40 // sink
        opacity = 1 - e * 0.6
        scale = 1 - e * 0.2
      }

      return (
        <div key={ci} style={{
          display: 'inline-block',
          margin: '0 3px',
          perspective: '600px',
        }}>
          <div style={{
            transformOrigin: '50% 100%',
            transform: `rotateX(${rotateX}deg) translateY(${translateY}px) scale(${scale})`,
            backfaceVisibility: 'hidden',
            opacity,
          }}>
            <div style={{
              fontFamily: "'Times New Roman', 'Georgia', serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textShadow: `0 8px 24px rgba(0,0,0,0.7)`,
              letterSpacing: '0.02em',
              overflow: 'hidden',
              padding: '8px 6px 16px',
              background: `linear-gradient(to bottom, ${color}08, ${color}03)`,
              borderRadius: '4px 4px 0 0',
            }}>
              {ch}
            </div>
            {/* Ground shadow */}
            <div style={{
              width: '100%', height: 4,
              background: `radial-gradient(ellipse at center, rgba(0,0,0,0.3), transparent)`,
              transform: 'scaleY(0.5)',
            }} />
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -40%)',
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'flex-end',
        }}>
          {charElements}
        </div>
      </div>
    )
  },
}

function TombstoneTiltComponent(props: MotionGraphicProps<TombstoneTiltConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tombstone-tilt',
  title: 'Kinetic Tombstone Tilt',
  description: 'Characters rise from the ground like stone monoliths, tilting backward via rotateX with bounce landing. Sways in wind on hold, topples forward on exit.',
  tags: ['kinetic', 'typography', '3d', 'tombstone', 'tilt', 'perspective', 'monolith', 'rise', 'rotation'],
  category: 'captions',
  component: TombstoneTiltComponent as any,
  defaultConfig: {
    words: ['STONE', 'RISEN', 'EPOCH', 'DECAY'],
    colors: ['#C8D0C0', '#E8E0D0', '#A8B8A0', '#D8C8B0'],
    bgColor: '#0a0e08',
    cycleDuration: 1.2,
    tiltAngle: 25,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STONE', 'RISEN', 'EPOCH', 'DECAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8D0C0', '#E8E0D0', '#A8B8A0', '#D8C8B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'tiltAngle', label: 'Tilt Angle', type: 'number', defaultValue: 25, min: 10, max: 60, group: 'Animation' },
  ],
})
