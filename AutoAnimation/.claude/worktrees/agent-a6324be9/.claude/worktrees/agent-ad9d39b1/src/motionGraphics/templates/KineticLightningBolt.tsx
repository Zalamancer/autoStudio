import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightningBoltConfig extends KineticBaseConfig {
  glitchIntensity: number
}

/* ---------- Easing ---------- */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
function easeInQuart(t: number): number {
  return t * t * t * t
}

/* ---------- Deterministic pseudo-random ---------- */
function hash(n: number): number {
  return (Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1
}

const BOLT_PALETTES = [
  { primary: '#FFE600', secondary: '#FF6B00', glow: '#FFE600' },
  { primary: '#00FFFF', secondary: '#0080FF', glow: '#00FFFF' },
  { primary: '#FF00FF', secondary: '#AA00FF', glow: '#FF00FF' },
  { primary: '#00FF88', secondary: '#00CCAA', glow: '#00FF88' },
]

/* Generate a jagged lightning path between two points */
function lightningPath(x1: number, y1: number, x2: number, y2: number, seed: number, jags = 6): string {
  const pts: [number, number][] = [[x1, y1]]
  for (let i = 1; i < jags; i++) {
    const t = i / jags
    const mx = x1 + (x2 - x1) * t
    const my = y1 + (y2 - y1) * t
    const offset = (Math.abs(hash(seed + i * 7.3)) - 0.5) * 40
    const perpX = -(y2 - y1) / Math.hypot(x2 - x1, y2 - y1)
    const perpY = (x2 - x1) / Math.hypot(x2 - x1, y2 - y1)
    pts.push([mx + perpX * offset, my + perpY * offset])
  }
  pts.push([x2, y2])
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Electric grid lines pulsing
    const gridOpacity = 0.04 + Math.sin(time * 8) * 0.015
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Electric grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,230,0,${gridOpacity}) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,230,0,${gridOpacity}) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
        {/* Center energy core */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,230,0,${0.03 + Math.sin(time * 12) * 0.02}) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const palette = BOLT_PALETTES[index % BOLT_PALETTES.length]
    const fontSize = Math.min(width / (word.length * 0.62), 115)
    const time = (frame ?? 0) / 30
    const cx = width / 2
    const cy = height / 2

    let scale = 1
    let opacity = 1
    let skewX = 0
    let textGlow = 1
    let clipProgress = 1 // 0 = fully clipped, 1 = fully revealed
    let glitchOffset = 0

    if (phase === 'enter') {
      const t = easeOutQuart(Math.min(1, enterProgress * 1.2))
      // Wipe in from left with electric feel
      clipProgress = t
      scale = 0.85 + t * 0.15
      opacity = Math.min(1, enterProgress * 4)
      skewX = (1 - t) * -12
      textGlow = t
      glitchOffset = (1 - t) * 8 * (Math.abs(hash(time * 100)) - 0.5)
    } else if (phase === 'hold') {
      // Electric flicker on hold
      const flicker = Math.abs(hash(Math.floor(time * 24) * 3.7)) > 0.92
      opacity = flicker ? 0.75 : 1
      textGlow = 0.8 + Math.sin(holdProgress * Math.PI * 8) * 0.2
      skewX = Math.sin(holdProgress * Math.PI * 6) * 0.5
      glitchOffset = Math.abs(hash(Math.floor(time * 30) * 5.1)) > 0.88 ? (Math.abs(hash(time * 200)) - 0.5) * 6 : 0
    } else {
      const t = easeInQuart(Math.min(1, exitProgress * 1.1))
      opacity = 1 - t
      scale = 1 + t * 0.15
      textGlow = 1 - t
      skewX = t * 8
    }

    // Lightning bolts radiating from word during enter
    const showBolts = phase === 'enter' && enterProgress < 0.6
    const boltOpacity = showBolts ? Math.max(0, 1 - enterProgress / 0.6) * 0.8 : 0

    // Jagged bolt endpoints from center outward
    const boltEndpoints = [
      [cx - width * 0.45, cy - height * 0.35],
      [cx + width * 0.45, cy - height * 0.35],
      [cx - width * 0.42, cy + height * 0.35],
      [cx + width * 0.42, cy + height * 0.35],
    ]

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Lightning bolt SVG */}
        {boltOpacity > 0 && (
          <svg
            width={width}
            height={height}
            style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            {boltEndpoints.map(([bx, by], i) => (
              <path
                key={i}
                d={lightningPath(cx, cy, bx, by, i * 13.7 + index * 5.1)}
                fill="none"
                stroke={palette.glow}
                strokeWidth={2 - i * 0.3}
                opacity={boltOpacity * (1 - i * 0.15)}
                strokeLinecap="round"
                filter={`blur(${1 + i * 0.5}px)`}
              />
            ))}
            {/* Bright inner bolt */}
            {boltEndpoints.slice(0, 2).map(([bx, by], i) => (
              <path
                key={`inner-${i}`}
                d={lightningPath(cx, cy, bx, by, i * 13.7 + index * 5.1)}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={0.8}
                opacity={boltOpacity * 0.6}
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}

        {/* Glow behind text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: `${word.length * 80}px`,
              maxWidth: '90%',
              height: '55%',
              background: `radial-gradient(ellipse, ${palette.glow}${Math.round(textGlow * 35)
                .toString(16)
                .padStart(2, '0')} 0%, transparent 70%)`,
              filter: 'blur(16px)',
            }}
          />
        </div>

        {/* Glitch layer (offset copy) */}
        {Math.abs(glitchOffset) > 0.5 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${glitchOffset}px)`,
              opacity: 0.35,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          >
            <span
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
                fontWeight: 900,
                color: palette.secondary,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>
        )}

        {/* Main word with clip reveal */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: `inset(0 ${((1 - clipProgress) * 100).toFixed(1)}% 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transform: `scale(${scale}) skewX(${skewX}deg)`,
              opacity,
              textShadow: `
                0 0 ${8 * textGlow}px ${palette.glow},
                0 0 ${20 * textGlow}px ${palette.glow}88,
                0 0 ${40 * textGlow}px ${palette.secondary}44,
                2px 0 0 ${palette.secondary},
                -2px 0 0 ${palette.glow}
              `,
              WebkitTextStroke: `0.5px ${palette.glow}`,
              filter: textGlow > 0.5 ? `brightness(${1 + textGlow * 0.3})` : 'none',
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function LightningBoltComponent(props: MotionGraphicProps<LightningBoltConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lightning-bolt',
  title: 'Lightning Bolt',
  description:
    'Word wipes in with electric clip-path reveal, jagged SVG lightning radiating outward, chromatic glitch offset, and neon glow. Hold phase flickers like a live charge. Perfect for AMAZING, ELECTRIC, POWER.',
  tags: [
    'kinetic',
    'typography',
    'lightning',
    'electric',
    'glitch',
    'neon',
    'glow',
    'highlight',
    'emphasis',
    'bolt',
    'energy',
    'wipe',
    'reveal',
    'impact',
  ],
  category: 'captions',
  component: LightningBoltComponent as any,
  defaultConfig: {
    words: ['AMAZING', 'ELECTRIC', 'POWER', 'LIVE'],
    colors: ['#FFE600', '#00FFFF', '#FF00FF', '#00FF88'],
    bgColor: '#0A0A0F',
    cycleDuration: 1.0,
    glitchIntensity: 6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['AMAZING', 'ELECTRIC', 'POWER', 'LIVE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFE600', '#00FFFF', '#FF00FF', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0F', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 3,
      group: 'Timing',
    },
    {
      key: 'glitchIntensity',
      label: 'Glitch Intensity',
      type: 'number',
      defaultValue: 6,
      min: 0,
      max: 20,
      group: 'Animation',
    },
  ],
})
