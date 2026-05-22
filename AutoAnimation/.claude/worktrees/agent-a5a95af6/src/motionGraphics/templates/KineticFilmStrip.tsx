import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmStripConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Scrolling film strip sprocket holes
    const holeSize = Math.max(12, width * 0.025)
    const holeSpacing = holeSize * 2.8
    const scrollOffset = (frame * 2.5) % holeSpacing
    const holeCount = Math.ceil(height / holeSpacing) + 2

    const stripWidth = width * 0.12
    const holes = Array.from({ length: holeCount }).map((_, i) => {
      const y = i * holeSpacing - scrollOffset
      return y
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Film grain noise overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Left film strip */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: stripWidth,
            height: '100%',
            background: '#111111',
            borderRight: '2px solid #333',
          }}
        >
          {holes.map((y, i) => (
            <div
              key={`l${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: y,
                width: holeSize,
                height: holeSize * 0.65,
                borderRadius: 2,
                background: bgColor,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
        </div>
        {/* Right film strip */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: stripWidth,
            height: '100%',
            background: '#111111',
            borderLeft: '2px solid #333',
          }}
        >
          {holes.map((y, i) => (
            <div
              key={`r${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: y,
                width: holeSize,
                height: holeSize * 0.65,
                borderRadius: 2,
                background: bgColor,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
        </div>
        {/* Frame number */}
        <div
          style={{
            position: 'absolute',
            bottom: '4%',
            right: width * 0.14,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(9px, 1.2vw, 13px)',
            color: '#666',
            letterSpacing: 2,
          }}
        >
          FR {String(frame).padStart(4, '0')}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    let opacity = 0
    let yOffset = 0

    if (phase === 'enter') {
      // Word scrolls up into the film frame
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      yOffset = (1 - eased) * 80
    } else if (phase === 'hold') {
      opacity = 1
      yOffset = 0
      // Subtle film jitter
      yOffset = Math.sin(holdProgress * Math.PI * 8) * 1.2
    } else {
      // Word scrolls up and out
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      yOffset = -eased * 80
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          color,
          letterSpacing: 6,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
        {/* Underline like film annotation */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: '10%',
            right: '10%',
            height: 2,
            background: `${color}40`,
            transform: `scaleX(${phase === 'enter' ? easeOutCubic(enterProgress) : phase === 'hold' ? 1 : 1 - exitProgress})`,
            transformOrigin: 'center',
          }}
        />
      </div>
    )
  },
}

function FilmStripComponent(props: MotionGraphicProps<FilmStripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-strip',
  title: 'Kinetic Film Strip',
  description: 'Words scroll through a vertical film strip with sprocket holes, film grain, and frame counter',
  tags: ['kinetic', 'typography', 'film', 'cinema', 'photography', 'strip', 'vintage'],
  category: 'captions',
  component: FilmStripComponent as any,
  defaultConfig: {
    words: ['FILM', 'ROLL', 'FRAME', 'CUT'],
    colors: ['#E8D8C0', '#D4C4A8', '#F0E0C8', '#C8B898'],
    bgColor: '#1C1810',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FILM', 'ROLL', 'FRAME', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D8C0', '#D4C4A8', '#F0E0C8', '#C8B898'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
