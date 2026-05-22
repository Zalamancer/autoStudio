import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DisintegrateConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate dust particle trajectory for Thanos-snap effect */
function dustTrajectory(particleIndex: number, charIndex: number, seed: number) {
  const r1 = rand(particleIndex * 73 + charIndex * 41 + seed)
  const r2 = rand(particleIndex * 59 + charIndex * 97 + seed + 100)
  const r3 = rand(particleIndex * 37 + charIndex * 83 + seed + 200)
  return {
    driftX: (r1 - 0.3) * 200, // bias rightward like wind
    driftY: (r2 - 0.6) * 150, // bias upward
    delay: r3 * 0.4,
    size: 1 + r1 * 3,
    lifetime: 0.5 + r2 * 0.5,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 197 + 83
    const chars = word.split('')

    // Dust particles during exit
    const dustParticles: { x: number; y: number; size: number; opacity: number; charOffset: number }[] = []

    const charElements = chars.map((ch, ci) => {
      // Snap disintegration sweeps left to right
      const snapDelay = (ci / Math.max(chars.length - 1, 1)) * 0.5
      let charOpacity = 1
      let tx = 0
      let ty = 0
      let scale = 1
      let filter = 'none'

      if (phase === 'enter') {
        // Reverse disintegration: dust coalesces into characters from right to left
        const charDelay = ((chars.length - 1 - ci) / Math.max(chars.length - 1, 1)) * 0.4
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
        const eased = 1 - Math.pow(1 - charProgress, 3)
        charOpacity = eased
        tx = (1 - eased) * 30
        ty = (1 - eased) * -10
        scale = 0.5 + eased * 0.5
        if (charProgress < 0.7) {
          filter = `blur(${(1 - charProgress / 0.7) * 2}px)`
        }

        // Incoming dust particles
        if (charProgress < 0.8) {
          for (let p = 0; p < 4; p++) {
            const traj = dustTrajectory(p, ci, seed)
            const pLife = Math.max(0, 1 - charProgress / 0.8)
            dustParticles.push({
              x: ci * 50 + traj.driftX * pLife,
              y: traj.driftY * pLife,
              size: traj.size * pLife,
              opacity: pLife * 0.6,
              charOffset: ci,
            })
          }
        }
      } else if (phase === 'hold') {
        // Subtle nervous tremor as if unstable
        const tremor = Math.sin(holdProgress * Math.PI * 8 + ci * 2.1) * 0.8
        tx = tremor
        ty = Math.cos(holdProgress * Math.PI * 6 + ci * 1.7) * 0.5
        charOpacity = 0.95 + rand(ci * 17 + Math.floor(f / 4)) * 0.05
      } else {
        // Thanos snap: left-to-right disintegration
        const snapProgress = Math.max(0, Math.min(1, (exitProgress - snapDelay) / 0.5))

        if (snapProgress > 0) {
          const eased = Math.pow(snapProgress, 1.5)
          charOpacity = Math.max(0, 1 - eased * 1.5)
          tx = eased * 40
          ty = eased * -20
          scale = 1 - eased * 0.5
          if (snapProgress > 0.3) {
            filter = `blur(${(snapProgress - 0.3) * 4}px)`
          }

          // Generate dust particles flying off
          const numDust = Math.floor(snapProgress * 8)
          for (let p = 0; p < numDust; p++) {
            const traj = dustTrajectory(p, ci, seed)
            const pProgress = Math.max(0, (snapProgress - traj.delay) / traj.lifetime)
            if (pProgress > 0 && pProgress < 1) {
              dustParticles.push({
                x: ci * 50 + traj.driftX * pProgress,
                y: traj.driftY * pProgress - 10,
                size: traj.size * (1 - pProgress),
                opacity: (1 - pProgress) * 0.7,
                charOffset: ci,
              })
            }
          }
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            filter,
            transition: 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          textShadow: `0 0 15px ${color}40`,
        }}
      >
        {charElements}
        {/* Dust particles */}
        {dustParticles.map((d, i) => (
          <div
            key={`d-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: color,
              opacity: d.opacity,
              transform: `translate(${d.x}px, ${d.y}px)`,
            }}
          />
        ))}
      </div>
    )
  },
}

function DisintegrateComponent(props: MotionGraphicProps<DisintegrateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-disintegrate',
  title: 'Kinetic Disintegrate',
  description:
    'Thanos-snap disintegration effect where text crumbles to dust particles drifting away left to right. Characters dissolve with blur and scatter into floating dust.',
  tags: ['kinetic', 'typography', 'disintegrate', 'thanos', 'snap', 'dust', 'particles', 'destruction'],
  category: 'captions',
  component: DisintegrateComponent as any,
  defaultConfig: {
    words: ['SNAP', 'DUST', 'GONE', 'FADE'],
    colors: ['#C0A080', '#D4A574', '#B8956A', '#A68B5B'],
    bgColor: '#0a0a14',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SNAP', 'DUST', 'GONE', 'FADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0A080', '#D4A574', '#B8956A', '#A68B5B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
