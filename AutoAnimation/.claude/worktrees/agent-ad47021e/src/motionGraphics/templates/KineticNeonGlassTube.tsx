import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonGlassTubeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Brick wall texture behind the neon sign
    const brickRows = Math.ceil(height / 24)
    const brickCols = Math.ceil(width / 50)
    const bricks = Array.from({ length: Math.min(brickRows * brickCols, 80) }, (_, i) => {
      const row = Math.floor(i / brickCols)
      const col = i % brickCols
      const offset = row % 2 === 0 ? 0 : 25
      const shade = 18 + rand(row * 31 + col * 17) * 8
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: col * 50 + offset,
            top: row * 24,
            width: 48,
            height: 22,
            background: `rgb(${shade}, ${shade * 0.7}, ${shade * 0.6})`,
            borderRadius: 1,
          }}
        />
      )
    })

    // Ambient neon glow on the wall — pulsing softly
    const glowPulse = 0.15 + Math.sin(time * 2) * 0.05

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Brick wall */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          {bricks}
        </div>
        {/* Mortar lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(0deg, rgba(10,8,6,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(10,8,6,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 24px',
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        />
        {/* Wall glow from neon — large soft radial */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,100,150,${glowPulse}), transparent 70%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Parse hex color to RGB for glow effects
    const r = parseInt(color.slice(1, 3), 16) || 255
    const g = parseInt(color.slice(3, 5), 16) || 100
    const b = parseInt(color.slice(5, 7), 16) || 150

    // Per-character segment-by-segment neon tube lighting
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let glowIntensity = 0
      let tubeFlicker = 1
      let yOff = 0

      if (phase === 'enter') {
        // Each tube segment lights up one by one with electric buzz delay
        const segmentDelay = (ci / word.length) * 0.7
        const p = Math.max(0, Math.min(1, (enterProgress - segmentDelay) / 0.3))

        if (p > 0 && p < 0.3) {
          // Initial buzz — flickers rapidly before catching
          tubeFlicker = rand(f * 7 + ci * 41) > 0.4 ? 1 : 0.1
          charOpacity = p * 3 * tubeFlicker
          glowIntensity = charOpacity * 0.5
        } else if (p >= 0.3 && p < 0.6) {
          // Catching — still unstable
          tubeFlicker = 0.7 + rand(f * 3 + ci * 23) * 0.3
          charOpacity = tubeFlicker
          glowIntensity = tubeFlicker * 0.7
        } else if (p >= 0.6) {
          // Fully lit with elastic settle
          const settle = easeOutElastic((p - 0.6) / 0.4)
          charOpacity = 1
          glowIntensity = 0.7 + settle * 0.3
          yOff = (1 - settle) * -3
        }
      } else if (phase === 'hold') {
        charOpacity = 1
        // Characteristic neon buzz — subtle random flicker + gentle breathing
        const breathe = 0.92 + Math.sin(time * 3.5 + ci * 0.8) * 0.08
        const buzz = rand(Math.floor(f * 0.5) + ci * 13) > 0.06 ? 1 : 0.7
        tubeFlicker = breathe * buzz
        charOpacity = tubeFlicker
        glowIntensity = tubeFlicker
        // Slight heat shimmer
        yOff = Math.sin(time * 2 + ci * 1.2) * 0.5
      } else {
        // Segments flicker off from end to start (reverse order)
        const segmentDelay = ((word.length - 1 - ci) / word.length) * 0.6
        const p = Math.max(0, Math.min(1, (exitProgress - segmentDelay) / 0.4))

        if (p < 0.5) {
          // Tube destabilizes — rapid flicker
          tubeFlicker = rand(f * 5 + ci * 37) > p * 1.5 ? 1 : 0.05
          charOpacity = tubeFlicker
          glowIntensity = tubeFlicker * (1 - p)
        } else {
          // Gas dies — fading afterglow
          const fade = (p - 0.5) / 0.5
          charOpacity = (1 - fade) * 0.15
          glowIntensity = 0
        }
      }

      const glowSize = 4 + glowIntensity * 20
      const outerGlow = glowIntensity * 30

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color: `rgba(255, 255, 255, ${charOpacity * 0.95})`,
            opacity: Math.max(charOpacity, 0.02),
            transform: `translateY(${yOff}px)`,
            textShadow: [
              `0 0 ${glowSize}px rgba(${r},${g},${b},${glowIntensity})`,
              `0 0 ${glowSize * 2}px rgba(${r},${g},${b},${glowIntensity * 0.6})`,
              `0 0 ${outerGlow}px rgba(${r},${g},${b},${glowIntensity * 0.3})`,
              `0 0 ${outerGlow * 2}px rgba(${r},${g},${b},${glowIntensity * 0.1})`,
            ].join(', '),
            filter: glowIntensity > 0.5 ? `brightness(${1 + glowIntensity * 0.3})` : undefined,
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Reflected glow on wall below text */}
        <div
          style={{
            position: 'absolute',
            top: '58%',
            left: '30%',
            width: '40%',
            height: '20%',
            background: `radial-gradient(ellipse at center, rgba(${r},${g},${b},0.08), transparent 70%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            mixBlendMode: 'screen',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function NeonGlassTubeComponent(props: MotionGraphicProps<NeonGlassTubeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-glass-tube',
  title: 'Kinetic Neon Glass Tube',
  description:
    'Neon sign with glass tube segments that flicker on one by one with electric buzz, mounted on a brick wall. Per-character ignition sequence, gas tube afterglow on exit, and ambient wall reflection.',
  tags: ['kinetic', 'typography', 'neon', 'sign', 'glass', 'tube', 'flicker', 'buzz', 'nightlife', 'bar'],
  category: 'captions',
  component: NeonGlassTubeComponent as any,
  defaultConfig: {
    words: ['OPEN', 'LATE', 'NITE', 'CLUB'],
    colors: ['#FF3366', '#FF6EC7', '#33CCFF', '#FFD700'],
    bgColor: '#0C0A08',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OPEN', 'LATE', 'NITE', 'CLUB'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3366', '#FF6EC7', '#33CCFF', '#FFD700'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0A08', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
