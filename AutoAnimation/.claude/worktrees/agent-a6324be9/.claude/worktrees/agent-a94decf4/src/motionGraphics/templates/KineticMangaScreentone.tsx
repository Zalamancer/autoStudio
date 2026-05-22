import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MangaScreentoneConfig extends KineticBaseConfig {}

// Manga screentone text style:
// N-tone halftone dot patterns layered over text and background,
// B&W manga aesthetic with occasional spot color,
// text filled with varying dot density screentone
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Shift screentone pattern over time (registration shift)
    const dotShift = (time * 5) % 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Dense halftone screentone layer (60 lpi simulation) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.18) 1.2px, transparent 1.2px)`,
            backgroundSize: `${6 + dotShift * 0.1}px ${6 + dotShift * 0.1}px`,
          }}
        />
        {/* Secondary tone layer (offset) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 0.8px, transparent 0.8px)`,
            backgroundSize: '10px 10px',
            backgroundPosition: `${5 + dotShift * 0.2}px ${5 + dotShift * 0.2}px`,
          }}
        />
        {/* Manga panel border */}
        <div
          style={{
            position: 'absolute',
            inset: '4px',
            border: '3px solid rgba(0,0,0,0.4)',
          }}
        />
        {/* Diagonal action lines for emotional emphasis */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              60deg,
              transparent 0px,
              transparent 20px,
              rgba(0,0,0,0.04) 20px,
              rgba(0,0,0,0.04) 21px
            )`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    const seed = index * 53 + 31

    if (phase === 'enter') {
      // Hard-cut snap in (manga panel transition feel)
      const snappedProgress = enterProgress > 0.3 ? 1 : enterProgress / 0.3
      opacity = snappedProgress
      scale = 1.1 - snappedProgress * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Screentone "breathing" — very subtle
      const dotPulse = 1 + Math.sin(Date.now() * 0.003 + seed) * 0.01
      scale = dotPulse
    } else {
      opacity = 1 - exitProgress * 2
      scale = 1 + exitProgress * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.max(0, opacity),
        }}
      >
        {/* Screentone overlay on text via mix-blend-mode */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 12vw, 170px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color,
              WebkitTextStroke: '3px #000000',
              textShadow: `
                3px 3px 0 #000,
                -2px -2px 0 #000,
                2px -2px 0 #000,
                -2px 2px 0 #000
              `,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
            }}
          >
            {word}
          </div>
          {/* Screentone dot fill overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)`,
              backgroundSize: '4px 4px',
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },
}

function MangaScreentoneComponent(props: MotionGraphicProps<MangaScreentoneConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-manga-screentone',
  title: 'Kinetic Manga Screentone',
  description: 'Manga screentone text with layered halftone dot patterns, B&W manga panel aesthetic, diagonal action lines, and hard panel-cut snap-in reveal',
  tags: ['kinetic', 'typography', 'manga', 'screentone', 'halftone', 'black-white', 'japanese', 'panel', 'comic'],
  category: 'captions',
  component: MangaScreentoneComponent as any,
  defaultConfig: {
    words: ['FIGHT', 'WIN', 'POWER', 'NOW'],
    colors: ['#FFFFFF', '#CCCCCC', '#FFFFFF', '#AAAAAA'],
    bgColor: '#F0F0F0',
    cycleDuration: 0.85,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIGHT', 'WIN', 'POWER', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#CCCCCC', '#FFFFFF', '#AAAAAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F0F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.85, min: 0.3, max: 5, group: 'Timing' },
  ],
})
