import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DreamyEtherealConfig extends KineticBaseConfig {
  glowIntensity: number
}

// Dreamy / ethereal mood: soft-focus pastel shimmer, slow floating particles,
// text materialises like waking from a dream — gentle blur-to-clarity reveal,
// letters drift with independent buoyancy, exit dissolves into luminous mist.

function easeOutSine(t: number): number {
  return Math.sin(t * Math.PI * 0.5)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Drifting luminous orbs — soft bokeh circles
    const orbs = Array.from({ length: 14 }, (_, i) => {
      const baseX = rand(i * 37 + 5) * 100
      const baseY = rand(i * 59 + 11) * 100
      const size = 30 + rand(i * 23) * 80
      const driftX = Math.sin(t * 0.15 + i * 0.9) * 12
      const driftY = Math.cos(t * 0.12 + i * 1.2) * 8
      const hueShift = rand(i * 19) * 40 - 20
      const pulse = 0.08 + Math.sin(t * 0.4 + i * 0.7) * 0.04

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${baseX + driftX}%`,
            top: `${baseY + driftY}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, hsla(${280 + hueShift}, 60%, 80%, ${pulse}) 0%, transparent 70%)`,
            filter: `blur(${size * 0.3}px)`,
            mixBlendMode: 'screen',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )
    })

    // Slow horizontal light wash
    const washX = 50 + Math.sin(t * 0.08) * 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {orbs}
        {/* Pastel light wash sweeping gently */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 40% at ${washX}% 50%, rgba(200,180,255,0.06) 0%, transparent 100%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* Soft vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(10,5,20,0.35) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      const total = word.length || 1
      let charOpacity = 1
      let blur = 0
      let yOff = 0
      let scale = 1

      if (phase === 'enter') {
        // Each letter emerges from soft blur at staggered times — like eyes opening
        const delay = (ci / (total + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutSine(p)

        charOpacity = ep
        blur = (1 - ep) * 12
        yOff = (1 - ep) * 20
        scale = 0.92 + ep * 0.08
      } else if (phase === 'hold') {
        // Gentle independent float — each letter drifts slightly
        const wt = holdProgress * Math.PI * 2 + ci * 0.8 + index * 1.3
        yOff = Math.sin(wt) * 4
        const xDrift = Math.cos(wt * 0.7 + ci) * 2
        // Subtle luminosity pulse
        charOpacity = 0.88 + Math.sin(wt * 1.3) * 0.12
        blur = 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              opacity: charOpacity,
              transform: `translate(${xDrift}px, ${yOff}px) scale(${scale})`,
              filter: 'none',
              textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
              transition: 'none',
            }}
          >
            {ch}
          </span>
        )
      } else {
        // Dissolve into luminous mist — blur outward and fade
        const delay = (ci / (total + 1)) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeOutSine(p)

        charOpacity = 1 - ep
        blur = ep * 16
        yOff = -ep * 15
        scale = 1 + ep * 0.15
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scale(${scale})`,
            filter: blur > 0.3 ? `blur(${blur}px)` : 'none',
            textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Glow layer behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            color,
            opacity: phase === 'enter' ? enterProgress * 0.25 : phase === 'hold' ? 0.25 : (1 - exitProgress) * 0.25,
            filter: 'blur(18px)',
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main character layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function DreamyEtherealComponent(props: MotionGraphicProps<DreamyEtherealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dreamy-ethereal',
  title: 'Kinetic Dreamy Ethereal',
  description: 'Soft-focus pastel shimmer with floating bokeh orbs. Letters emerge from blur like waking from a dream, drift gently during hold, and dissolve into luminous mist.',
  tags: ['kinetic', 'typography', 'dreamy', 'ethereal', 'pastel', 'soft', 'floating', 'mood', 'atmosphere'],
  category: 'captions',
  component: DreamyEtherealComponent as any,
  defaultConfig: {
    words: ['DREAM', 'FLOAT', 'GLOW', 'DRIFT'],
    colors: ['#D4B8FF', '#FFB8D4', '#B8D4FF', '#FFD4B8'],
    bgColor: '#0C0716',
    cycleDuration: 1.2,
    glowIntensity: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'FLOAT', 'GLOW', 'DRIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4B8FF', '#FFB8D4', '#B8D4FF', '#FFD4B8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0716', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'glowIntensity', label: 'Glow Intensity', type: 'number', defaultValue: 60, min: 10, max: 100, group: 'Animation' },
  ],
})
