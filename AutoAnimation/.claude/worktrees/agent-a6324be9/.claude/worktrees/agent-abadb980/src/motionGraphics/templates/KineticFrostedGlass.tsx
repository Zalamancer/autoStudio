import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FrostedGlassConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Condensation droplets on glass
    const droplets: React.ReactNode[] = []
    const numDroplets = 24
    for (let i = 0; i < numDroplets; i++) {
      const dx = width * rand(i * 41 + 7)
      const dy = height * rand(i * 67 + 13)
      // Droplets slowly slide down
      const slide = ((t * 2 + rand(i * 29) * 20) % 30) * (1 + rand(i * 53) * 2)
      const finalY = (dy + slide) % (height + 10)
      const size = 2 + rand(i * 19) * 5
      const alpha = 0.08 + rand(i * 37) * 0.1

      droplets.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dx,
            top: finalY,
            width: size,
            height: size * (1.2 + rand(i * 23) * 0.6),
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            background: `radial-gradient(ellipse at 35% 30%, rgba(255,255,255,${alpha + 0.08}), rgba(200,220,240,${alpha}) 60%, transparent)`,
          }}
        />,
      )
    }

    // Water streaks running down glass
    const streaks: React.ReactNode[] = []
    for (let s = 0; s < 6; s++) {
      const sx = width * (0.1 + rand(s * 71 + 31) * 0.8)
      const streakLen = 40 + rand(s * 47) * 80
      const sy = ((t * 8 + rand(s * 83) * 200) % (height + streakLen * 2)) - streakLen

      streaks.push(
        <div
          key={`s${s}`}
          style={{
            position: 'absolute',
            left: sx,
            top: sy,
            width: 1.5,
            height: streakLen,
            background: `linear-gradient(180deg, transparent, rgba(200,220,240,0.08) 20%, rgba(200,220,240,0.12) 50%, rgba(200,220,240,0.04) 80%, transparent)`,
            borderRadius: 1,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Frosted glass overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(180,200,220,0.06), rgba(140,160,180,0.03) 50%, transparent 80%)`,
          }}
        />
        {streaks}
        {droplets}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Finger wipe clear spot: circular reveal that moves across the word
    let wipeProgress = 0
    let wipeX = 0
    let globalBlur = 12 // frosted glass blur
    let globalOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      // Wipe moves from left to right, revealing word
      wipeProgress = ep
      wipeX = -0.3 + ep * 1.6 // from beyond left to beyond right
      globalBlur = 12 * (1 - ep * 0.85) // blur decreases as wipe happens
      globalOpacity = 0.3 + ep * 0.7
    } else if (phase === 'hold') {
      wipeProgress = 1
      wipeX = 0.5
      globalBlur = 1.5 + Math.sin(t * 1.5) * 0.5 // subtle residual frost shimmer
      globalOpacity = 1
    } else {
      const ep = easeInQuad(exitProgress)
      // Frost reforms: blur increases, opacity drops
      wipeProgress = 1 - ep
      wipeX = 0.5
      globalBlur = 1.5 + ep * 12
      globalOpacity = 1 - ep * 0.7
    }

    // Per-character frost reveal
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5

      let charBlur = globalBlur
      let charOpacity = globalOpacity
      let charScale = 1

      if (phase === 'enter') {
        // Wipe clear spot is centered at wipeX, characters near it become clear
        const distFromWipe = Math.abs(charNorm - wipeX)
        const wipeRadius = 0.4
        const clarity = Math.max(0, 1 - distFromWipe / wipeRadius)
        charBlur = globalBlur * (1 - clarity * 0.9)
        charOpacity = globalOpacity * (0.5 + clarity * 0.5)
        charScale = 0.95 + clarity * 0.05
      } else if (phase === 'hold') {
        // Slight condensation re-forming effect
        const condensation = Math.sin(t * 2 + ci * 0.7) * 0.3 + 0.7
        charBlur = globalBlur * condensation
      } else {
        // Frost reclaims from edges inward
        const edgeDist = Math.min(charNorm, 1 - charNorm)
        const frostReclaim = Math.max(0, exitProgress - edgeDist * 0.5)
        charBlur = globalBlur + frostReclaim * 4
        charOpacity = globalOpacity * (1 - frostReclaim * 0.3)
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            filter: `blur(${charBlur}px)`,
            transform: `scale(${charScale})`,
            textShadow: `0 0 ${8 + charBlur}px rgba(200,220,255,0.4), 0 0 2px rgba(255,255,255,0.3)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Wipe clear spot glow during enter
    let wipeGlow: React.ReactNode = null
    if (phase === 'enter' && enterProgress > 0.05 && enterProgress < 0.95) {
      const glowX = wipeX * 100
      wipeGlow = (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${glowX}%`,
            width: 120,
            height: 120,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,255,255,0.08), rgba(200,220,240,0.04) 40%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )
    }

    // Condensation breath effect on glass
    let breathFog: React.ReactNode = null
    if (phase === 'exit' && exitProgress > 0.2) {
      const fogAlpha = Math.min(0.15, (exitProgress - 0.2) * 0.2)
      breathFog = (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            width: width * 0.5,
            height: height * 0.3,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(200,220,240,${fogAlpha}), transparent 70%)`,
            filter: 'blur(15px)',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {wipeGlow}
        {breathFog}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function FrostedGlassComponent(props: MotionGraphicProps<FrostedGlassConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-frosted-glass',
  title: 'Kinetic Frosted Glass',
  description: 'Text behind frosted glass pane, finger wipes clear spot to reveal each word, condensation droplets, blur-to-sharp transition',
  tags: ['kinetic', 'typography', 'glass', 'frost', 'blur', 'reveal', 'condensation', 'optics'],
  category: 'captions',
  component: FrostedGlassComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'CLEAR', 'FOCUS', 'LIGHT'],
    colors: ['#E0EEFF', '#C8DEFF', '#D8E8FF', '#F0F6FF'],
    bgColor: '#0c1525',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'CLEAR', 'FOCUS', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0EEFF', '#C8DEFF', '#D8E8FF', '#F0F6FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1525', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
