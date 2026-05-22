import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightPaintingConfig extends KineticBaseConfig {
  trailWidth: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Long-exposure photography — pitch-dark room
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Faint ambient noise from sensor */}
        {Array.from({ length: 12 }, (_, i) => {
          const rx = rand(i * 71) * 100
          const ry = rand(i * 43) * 100
          const rs = rand(i * 97) * 2 + 1
          const ro = 0.015 + rand(i * 31) * 0.02
          const rp = Math.sin(time * (1 + i * 0.3) + i) * 0.5 + 0.5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${rx}%`,
                top: `${ry}%`,
                width: rs,
                height: rs,
                borderRadius: '50%',
                background: `rgba(255,255,255,${ro * rp})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let revealClip = 0
    let trailGlowIntensity = 0
    let persistBrightness = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = 1
      revealClip = p // how much of the text is "drawn in"
      trailGlowIntensity = 1 - enterProgress * 0.5 // bright at the drawing tip
      persistBrightness = p * 0.6
    } else if (phase === 'hold') {
      opacity = 1
      revealClip = 1
      // Painted light persists — gentle intensity drift
      trailGlowIntensity = 0.5 + Math.sin(holdProgress * Math.PI * 4) * 0.12
      persistBrightness = 0.6
    } else {
      opacity = 1 - exitProgress
      revealClip = 1
      trailGlowIntensity = 0.5 * (1 - exitProgress)
      persistBrightness = 0.6 * (1 - exitProgress)
    }

    const tipX = revealClip * 100
    const particleCount = 8

    return (
      <>
        {/* Main light-painted text — revealed left-to-right via clip-path */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            opacity: opacity * persistBrightness * 1.5,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            textShadow: `0 0 20px ${color}, 0 0 40px ${color}80, 0 0 80px ${color}40`,
          }}
        >
          {word}
        </div>
        {/* Bright over-exposed version — light painting always brighter than scene */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(255,255,255,0.9)',
            opacity: opacity * persistBrightness * 0.6,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            filter: 'blur(1px)',
          }}
        >
          {word}
        </div>
        {/* Drawing-tip glow — the bright light source moving along */}
        {revealClip < 0.99 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(50% + ${(tipX / 100 - 0.5) * 80}vw)`,
              transform: 'translate(-50%, -50%)',
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,255,255,${trailGlowIntensity}) 0%, ${color}99 40%, transparent 70%)`,
              filter: 'blur(6px)',
              opacity,
            }}
          />
        )}
        {/* Spark particles trailing from tip */}
        {revealClip > 0.02 && revealClip < 0.98 && Array.from({ length: particleCount }, (_, i) => {
          const seed = i * 73 + index * 19 + f
          const ox = (rand(seed) - 0.5) * 40
          const oy = (rand(seed + 1) - 0.5) * 30
          const ps = rand(seed + 2) * 4 + 2
          const po = rand(seed + 3) * 0.8 * trailGlowIntensity
          const px = (tipX / 100 - 0.5) * 80
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `calc(50% + ${px}vw + ${ox}px)`,
                transform: `translate(-50%, calc(-50% + ${oy}px))`,
                width: ps,
                height: ps,
                borderRadius: '50%',
                background: `rgba(255,230,150,${po})`,
                filter: 'blur(1px)',
                opacity,
              }}
            />
          )
        })}
      </>
    )
  },
}

function LightPaintingComponent(props: MotionGraphicProps<LightPaintingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-light-painting',
  title: 'Kinetic Light Painting',
  description: 'Long-exposure light painting effect — text is drawn from left to right by a bright light source, leaving glowing trails with spark particles in a dark room',
  tags: ['kinetic', 'typography', 'light-painting', 'long-exposure', 'trail', 'glow', 'dark', 'photography', 'art'],
  category: 'captions',
  component: LightPaintingComponent as any,
  defaultConfig: {
    words: ['DRAW', 'LIGHT', 'PAINT', 'GLOW'],
    colors: ['#00E5FF', '#FF6BCB', '#FFD93D', '#6BCB77'],
    bgColor: '#020205',
    cycleDuration: 1.8,
    trailWidth: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAW', 'LIGHT', 'PAINT', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00E5FF', '#FF6BCB', '#FFD93D', '#6BCB77'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020205', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
    { key: 'trailWidth', label: 'Trail Width', type: 'number', defaultValue: 3, min: 1, max: 8, group: 'Animation' },
  ],
})
