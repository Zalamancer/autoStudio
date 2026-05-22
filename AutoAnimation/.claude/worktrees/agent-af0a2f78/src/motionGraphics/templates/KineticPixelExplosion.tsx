import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PixelExplosionConfig extends KineticBaseConfig {
  particleCount: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(90deg, rgba(255,100,0,0.03) 1px, transparent 1px)',
              'linear-gradient(0deg, rgba(255,100,0,0.03) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '6px 6px',
            pointerEvents: 'none',
          }}
        />
        {/* Floating embers */}
        {Array.from({ length: 12 }, (_, i) => {
          const px = ((i * 31 + 17) % 100)
          const py = ((i * 47 + time * (5 + i % 4)) % 120) - 10
          return (
            <div
              key={`ember-${i}`}
              style={{
                position: 'absolute',
                left: `${px}%`,
                top: `${py}%`,
                width: 3,
                height: 3,
                background: i % 3 === 0 ? '#FF6600' : i % 3 === 1 ? '#FFD700' : '#FF3300',
                opacity: 0.3 + seededRandom(i + 100) * 0.3,
                imageRendering: 'pixelated' as any,
              }}
            />
          )
        })}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Text assembles from scattered pixels
      const chars = word.split('')
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 'clamp(2px, 0.5vw, 6px)',
          }}
        >
          {chars.map((ch, ci) => {
            const delay = ci * 0.12
            const charProgress = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
            const offsetX = (1 - charProgress) * (seededRandom(ci + index * 100) - 0.5) * 300
            const offsetY = (1 - charProgress) * (seededRandom(ci + index * 100 + 50) - 0.5) * 200
            const rot = (1 - charProgress) * (seededRandom(ci + 30) - 0.5) * 360
            return (
              <div
                key={ci}
                style={{
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: 'clamp(36px, 11vw, 150px)',
                  fontWeight: 700,
                  color,
                  textTransform: 'uppercase',
                  transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rot}deg)`,
                  opacity: charProgress,
                  textShadow: `0 0 8px ${color}`,
                  WebkitFontSmoothing: 'none' as any,
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Shake subtly
      const shakeX = Math.sin(f * 0.15) * 2
      const shakeY = Math.cos(f * 0.12) * 1.5
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${shakeX}px, ${shakeY}px)`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 6px)',
            textShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: explode into pixel particles
    const particleCount = 40
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const angle = seededRandom(i + index * 200) * Math.PI * 2
      const speed = 60 + seededRandom(i + 300) * 200
      const size = 4 + Math.floor(seededRandom(i + 400) * 8)
      const px = Math.cos(angle) * speed * exitProgress
      const py = Math.sin(angle) * speed * exitProgress + exitProgress * exitProgress * 80
      const pOpacity = Math.max(0, 1 - exitProgress * 1.3)
      const hue = seededRandom(i + 500) > 0.5 ? 30 : seededRandom(i + 600) > 0.5 ? 0 : 50
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            background: `hsl(${hue}, 100%, ${50 + seededRandom(i) * 30}%)`,
            transform: `translate(${px}px, ${py}px)`,
            opacity: pOpacity,
            imageRendering: 'pixelated' as any,
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Fading text */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 6px)',
            opacity: Math.max(0, 1 - exitProgress * 2),
            transform: `scale(${1 + exitProgress * 0.3})`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
        {/* Explosion particles */}
        <div style={{ position: 'absolute', top: '50%', left: '50%' }}>
          {particles}
        </div>
      </div>
    )
  },
}

function KineticPixelExplosionComponent(props: MotionGraphicProps<PixelExplosionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pixel-explosion',
  title: 'Kinetic Pixel Explosion',
  description: 'Words assemble from scattered pixel characters then explode into colorful pixel particles on exit',
  tags: ['kinetic', 'typography', 'pixel', 'explosion', 'retro', 'gaming', 'particles', '8-bit'],
  category: 'captions',
  component: KineticPixelExplosionComponent as any,
  defaultConfig: {
    words: ['BOOM', 'BLAST', 'POW', 'BANG'],
    colors: ['#FF6600', '#FFD700', '#FF3333', '#FF9900'],
    bgColor: '#0d0d1a',
    cycleDuration: 1.6,
    particleCount: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOM', 'BLAST', 'POW', 'BANG'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6600', '#FFD700', '#FF3333', '#FF9900'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'particleCount', label: 'Particle Count', type: 'number', defaultValue: 40, min: 10, max: 80, group: 'Style' },
  ],
})
