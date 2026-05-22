import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GridArchitectConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const majorGrid = 40
    const minorGrid = 8
    const majorColor = 'rgba(100, 160, 200, 0.18)'
    const minorColor = 'rgba(100, 160, 200, 0.06)'

    // Margin lines (red like real graph paper)
    const marginLeft = 48
    const marginTop = 36

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Minor grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(90deg, ${minorColor} 1px, transparent 1px)`,
              `linear-gradient(0deg, ${minorColor} 1px, transparent 1px)`,
            ].join(', '),
            backgroundSize: `${minorGrid}px ${minorGrid}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Major grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(90deg, ${majorColor} 1px, transparent 1px)`,
              `linear-gradient(0deg, ${majorColor} 1px, transparent 1px)`,
            ].join(', '),
            backgroundSize: `${majorGrid}px ${majorGrid}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Red margin line (vertical) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: marginLeft,
            width: 1,
            height: '100%',
            background: 'rgba(220, 80, 80, 0.25)',
            pointerEvents: 'none',
          }}
        />
        {/* Red margin line (horizontal) */}
        <div
          style={{
            position: 'absolute',
            top: marginTop,
            left: 0,
            width: '100%',
            height: 1,
            background: 'rgba(220, 80, 80, 0.25)',
            pointerEvents: 'none',
          }}
        />
        {/* Corner annotation */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(100, 160, 200, 0.3)',
            letterSpacing: 1,
          }}
        >
          SCALE: 1:100
        </div>
        {/* Grid coordinate numbers along top */}
        {Array.from({ length: Math.floor(width / majorGrid) }, (_, i) => (
          <div
            key={`coord-${i}`}
            style={{
              position: 'absolute',
              top: marginTop + 4,
              left: marginLeft + i * majorGrid + 4,
              fontFamily: "'Courier New', monospace",
              fontSize: 6,
              color: 'rgba(100, 160, 200, 0.2)',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 47 + 13

    if (phase === 'enter') {
      // Letters appear one by one, snapping to grid positions
      const chars = word.split('').map((ch, ci) => {
        const charDelay = ci / (word.length + 1) * 0.6
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))

        // Snap from above with grid alignment
        const snapY = (1 - charProgress) * -30
        const opacity = charProgress

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${snapY}px)`,
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
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
          {/* Pencil mark line under text */}
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: `${enterProgress * 100}%`,
              height: 2,
              background: `${color}60`,
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Solid on grid, with subtle pencil annotations
      const annotationOpacity = 0.3 + Math.sin(holdProgress * Math.PI * 2) * 0.15

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(42px, 11vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
          {/* Underline */}
          <div style={{ position: 'absolute', bottom: -8, left: 0, right: 0, height: 2, background: `${color}60` }} />
          {/* Annotation arrow */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -30,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${color}`,
              opacity: annotationOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            {`<-- ${word.length * 1.2}m`}
          </div>
        </div>
      )
    } else {
      // Exit: letters drop off grid one by one
      const chars = word.split('').map((ch, ci) => {
        const charDelay = ci / (word.length + 1) * 0.4
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${charProgress * 40}px)`,
              opacity: 1 - charProgress,
              color,
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
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function GridArchitectComponent(props: MotionGraphicProps<GridArchitectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-grid-architect',
  title: 'Kinetic Grid Architect',
  description: 'Words placed on architectural grid paper with margin lines, coordinate numbers, scale annotations, and letter-by-letter snap entrance',
  tags: ['kinetic', 'typography', 'grid', 'architect', 'graph-paper', 'technical', 'drafting'],
  category: 'captions',
  component: GridArchitectComponent as any,
  defaultConfig: {
    words: ['ARCH', 'GRID', 'PLAN', 'SCALE'],
    colors: ['#3B6B8A', '#4A7A9A', '#3B6B8A', '#4A7A9A'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ARCH', 'GRID', 'PLAN', 'SCALE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3B6B8A', '#4A7A9A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
