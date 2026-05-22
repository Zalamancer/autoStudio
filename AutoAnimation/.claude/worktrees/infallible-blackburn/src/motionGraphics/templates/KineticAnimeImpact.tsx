import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnimeImpactConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Radial speed lines from center (manga impact lines)
    const numLines = 24
    const lineAngleStep = 360 / numLines
    const flashOpacity = Math.max(0, 1 - (time % 1) * 4) // quick white flash on impact
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Radial burst lines */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {Array.from({ length: numLines }).map((_, i) => {
            const angle = i * lineAngleStep * (Math.PI / 180)
            const x2 = 50 + Math.cos(angle) * 80
            const y2 = 50 + Math.sin(angle) * 80
            const thickness = i % 3 === 0 ? 0.6 : 0.25
            return (
              <line
                key={i}
                x1="50" y1="50"
                x2={x2} y2={y2}
                stroke="rgba(0,0,0,0.12)"
                strokeWidth={thickness}
              />
            )
          })}
        </svg>
        {/* Halftone dot screentone overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
          }}
        />
        {/* Impact flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'white',
            opacity: flashOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let skewX = 0
    let skewY = 0
    const seed = index * 41 + 7

    if (phase === 'enter') {
      // Slam in with extreme scale-down + elastic (manga impact frame)
      opacity = Math.min(1, enterProgress * 4)
      const t = enterProgress
      const elastic = t < 0.6
        ? 4 - t * 5 + Math.sin(t * Math.PI * 4) * (1 - t) * 0.8
        : 1 + Math.sin(t * Math.PI * 6) * (1 - t) * 0.12
      scale = elastic
      skewX = (1 - enterProgress) * ((seed % 2 === 0) ? 15 : -15)
      skewY = (1 - enterProgress) * 5
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle vibration — deterministic
      const vib = Math.sin(Date.now() * 0.04 + seed) * 1.5
      skewX = vib
    } else {
      opacity = 1 - exitProgress * exitProgress
      scale = 1 + exitProgress * 0.15
      skewX = exitProgress * 10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) skew(${skewX}deg, ${skewY}deg)`,
          opacity,
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 'clamp(52px, 15vw, 200px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontStyle: 'italic',
          color,
          WebkitTextStroke: '4px #000000',
          textShadow: '6px 6px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 20px rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
          letterSpacing: -2,
        }}
      >
        {word}
      </div>
    )
  },
}

function AnimeImpactComponent(props: MotionGraphicProps<AnimeImpactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anime-impact',
  title: 'Kinetic Anime Impact Frame',
  description: 'Japanese manga/anime impact frame with radial speed lines, halftone screentone, white flash, and elastic slam-in typography',
  tags: ['kinetic', 'typography', 'anime', 'manga', 'impact', 'japanese', 'speed-lines', 'screentone'],
  category: 'captions',
  component: AnimeImpactComponent as any,
  defaultConfig: {
    words: ['SUGOI', 'NANI', 'NAKAMA', 'YATTA'],
    colors: ['#FF0000', '#FF6600', '#FFCC00', '#00CCFF'],
    bgColor: '#FFFFFF',
    cycleDuration: 0.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUGOI', 'NANI', 'NAKAMA', 'YATTA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0000', '#FF6600', '#FFCC00', '#00CCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
