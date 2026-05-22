import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ExplodeReformConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate stable explosion vector per character */
function explodeVector(charIndex: number, seed: number) {
  const angle = rand(charIndex * 97 + seed * 13) * Math.PI * 2
  const force = 0.4 + rand(charIndex * 53 + seed * 29) * 0.6
  return {
    dx: Math.cos(angle) * force,
    dy: Math.sin(angle) * force,
    rotation: (rand(charIndex * 41 + seed * 7) - 0.5) * 720,
    scale: 0.2 + rand(charIndex * 31 + seed * 11) * 0.4,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Subtle radial pulse on explosion moments
    const pulse = Math.sin(frame * 0.1) * 0.02
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${bgColor} 60%, #000 100%)`,
          opacity: 1 + pulse,
        }}
      />
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 173 + 59
    const chars = word.split('')

    // Particles that float around during hold
    const particles: { x: number; y: number; size: number; opacity: number }[] = []
    if (phase === 'hold') {
      for (let i = 0; i < 12; i++) {
        const angle = (holdProgress * 3 + i * 0.52) * Math.PI * 2
        const dist = 30 + rand(i * 17 + seed) * 60 + Math.sin(holdProgress * Math.PI * 4 + i) * 10
        particles.push({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 2 + rand(i * 7) * 3,
          opacity: 0.3 + Math.sin(holdProgress * Math.PI * 6 + i * 1.2) * 0.3,
        })
      }
    }

    const charElements = chars.map((ch, ci) => {
      const vec = explodeVector(ci, seed)
      let tx = 0
      let ty = 0
      let rot = 0
      let scale = 1
      let opacity = 1

      if (phase === 'enter') {
        // Reverse explosion: particles fly IN to reassemble
        const easeIn = 1 - Math.pow(1 - enterProgress, 3)
        const spread = 300
        tx = vec.dx * spread * (1 - easeIn)
        ty = vec.dy * spread * (1 - easeIn)
        rot = vec.rotation * (1 - easeIn)
        scale = vec.scale + (1 - vec.scale) * easeIn
        opacity = enterProgress
      } else if (phase === 'hold') {
        // Gentle floating wobble
        const wobbleX = Math.sin(holdProgress * Math.PI * 4 + ci * 0.8) * 2
        const wobbleY = Math.cos(holdProgress * Math.PI * 3 + ci * 1.1) * 1.5
        tx = wobbleX
        ty = wobbleY
        opacity = 1
      } else {
        // Exit: explode outward
        const easeOut = Math.pow(exitProgress, 2)
        const spread = 400
        tx = vec.dx * spread * easeOut
        ty = vec.dy * spread * easeOut
        rot = vec.rotation * easeOut
        scale = 1 - easeOut * (1 - vec.scale)
        opacity = 1 - easeOut
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})`,
            opacity,
            color,
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
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
        }}
      >
        {charElements}
        {/* Floating particles during hold */}
        {particles.map((p, i) => (
          <div
            key={`p-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: color,
              opacity: p.opacity,
              transform: `translate(${p.x}px, ${p.y}px)`,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        ))}
      </div>
    )
  },
}

function ExplodeReformComponent(props: MotionGraphicProps<ExplodeReformConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-explode-reform',
  title: 'Kinetic Explode Reform',
  description:
    'Text explodes into particles scattering outward then reassembles in reverse. Characters fly apart with rotation and reform into readable text.',
  tags: ['kinetic', 'typography', 'explode', 'particles', 'reform', 'destruction', 'dramatic'],
  category: 'captions',
  component: ExplodeReformComponent as any,
  defaultConfig: {
    words: ['BOOM', 'BLAST', 'SHATTER', 'REFORM'],
    colors: ['#FF6B35', '#F7C948', '#FF3D3D', '#FFB800'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOM', 'BLAST', 'SHATTER', 'REFORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#F7C948', '#FF3D3D', '#FFB800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
