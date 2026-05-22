import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SprayPaintConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Deterministic overspray dots around stencil edges
const OVERSPRAY_DOTS = Array.from({ length: 28 }, (_, i) => ({
  angle: (i / 28) * Math.PI * 2,
  radius: 18 + rand(i * 31) * 40,
  size: 2 + rand(i * 17) * 5,
  offsetX: Math.cos((i / 28) * Math.PI * 2) * (18 + rand(i * 31) * 40),
  offsetY: Math.sin((i / 28) * Math.PI * 2) * (18 + rand(i * 31) * 40),
}))

// Stencil edge drip positions (short runs below letters)
const STENCIL_DRIPS = Array.from({ length: 6 }, (_, i) => ({
  xPercent: 10 + i * 15,
  height: 8 + rand(i * 43) * 18,
  width: 3 + rand(i * 19) * 4,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Concrete wall — horizontal stucco lines and subtle grit
    const lines = Array.from({ length: 14 }, (_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${(i / 14) * 100}%`,
          height: 1,
          background: `rgba(0,0,0,${0.04 + rand(i * 7) * 0.04})`,
        }}
      />
    ))

    // Faint older stencil ghost behind the main text area
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lines}
        {/* Overspray haze on wall from previous tags */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '15%',
            width: '70%',
            height: '40%',
            borderRadius: '40%',
            background: 'radial-gradient(ellipse, rgba(180,180,200,0.06) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            width: '40%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,180,180,0.04) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 71

    // Spray paint sweeps left-to-right, revealing text through stencil clip
    let revealPercent = 0
    let hazeOpacity = 0
    let textOpacity = 0
    let overSprayOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      revealPercent = ep * 100
      hazeOpacity = Math.sin(enterProgress * Math.PI) * 0.35
      textOpacity = Math.min(1, enterProgress * 3)
      overSprayOpacity = enterProgress < 0.7 ? enterProgress / 0.7 : 1 - (enterProgress - 0.7) / 0.3
    } else if (phase === 'hold') {
      revealPercent = 100
      textOpacity = 1
      hazeOpacity = 0.08 + Math.sin(holdProgress * Math.PI * 3 + seed) * 0.03
      overSprayOpacity = 0.4 + Math.sin(holdProgress * Math.PI * 2) * 0.05
    } else {
      // Exit: stencil lifted — text stays but haze fades with slight vertical lift
      revealPercent = 100
      textOpacity = 1 - exitProgress * exitProgress
      hazeOpacity = 0
      overSprayOpacity = (1 - exitProgress) * 0.4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Overspray haze — soft radial blur around text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140%',
            height: '200%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${color}${Math.round(hazeOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            filter: 'blur(18px)',
            pointerEvents: 'none',
          }}
        />

        {/* Overspray micro-dots at stencil edges */}
        {OVERSPRAY_DOTS.map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `calc(50% + ${dot.offsetY * 0.5}px)`,
              left: `calc(50% + ${dot.offsetX}px)`,
              width: dot.size,
              height: dot.size,
              borderRadius: '50%',
              background: color,
              opacity: overSprayOpacity * (0.3 + rand(i * 13 + seed) * 0.5),
              filter: `blur(${1 + rand(i * 7) * 2}px)`,
            }}
          />
        ))}

        {/* Main stencil text — revealed left to right via clip-path */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
            fontSize: 'clamp(52px, 15vw, 175px)',
            fontWeight: 900,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color,
            opacity: textOpacity,
            clipPath: `inset(0 ${100 - revealPercent}% 0 0)`,
            whiteSpace: 'nowrap',
            // Spray paint has slightly fuzzy, uneven edges
            filter: phase === 'enter' && enterProgress < 0.9 ? `blur(${(1 - enterProgress) * 1.5}px)` : undefined,
            textShadow: `
              0 0 8px ${color}60,
              2px 2px 0 ${color}30,
              -1px -1px 0 ${color}20
            `,
          }}
        >
          {word}
        </div>

        {/* Stencil drips below text */}
        {STENCIL_DRIPS.map((drip, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '100%',
              left: `${drip.xPercent}%`,
              width: drip.width,
              height: drip.height * Math.min(1, revealPercent / 60),
              background: `linear-gradient(180deg, ${color}${Math.round(overSprayOpacity * 200).toString(16).padStart(2, '0')}, ${color}00)`,
              borderRadius: '0 0 2px 2px',
            }}
          />
        ))}
      </div>
    )
  },
}

function SprayPaintComponent(props: MotionGraphicProps<SprayPaintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spray-paint',
  title: 'Kinetic Spray Paint',
  description:
    'Stencil spray paint reveal — text appears through a stencil with overspray haze, micro-dot edges, and drips on a concrete wall background.',
  tags: ['kinetic', 'typography', 'spray', 'stencil', 'graffiti', 'urban', 'paint', 'street', 'art'],
  category: 'captions',
  component: SprayPaintComponent as any,
  defaultConfig: {
    words: ['SPRAY', 'STENCIL', 'URBAN', 'ART'],
    colors: ['#FF3366', '#00E5FF', '#FFD600', '#FF6B00'],
    bgColor: '#2A2A2A',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPRAY', 'STENCIL', 'URBAN', 'ART'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00E5FF', '#FFD600', '#FF6B00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2A2A2A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
