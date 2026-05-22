import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Film Aesthetic: Anime Opening Title Card — speed lines, kanji-style slam, dramatic zoom
// Mechanic: text rockets in from a vanishing point with speed lines, screen flash on arrival

interface AnimeOpeningTitleConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Speed lines radiating from center — the anime opening signature
    const lines = Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * 360
      const length = 55 + (i * 7) % 25
      const opacity = 0.05 + (i % 3) * 0.03
      const animOffset = (time * 80 + i * 15) % 100
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${length}%`,
            height: 1 + (i % 2),
            background: `rgba(255,255,255,${opacity})`,
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg) translateX(${animOffset * 0.1}%)`,
          }}
        />
      )
    })

    // Flash on beat (simulating the "hit" moment of an anime OP)
    const flash = Math.max(0, 1 - (time % 2) * 4) * 0.15

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0a0015 0%, #150025 50%, #0a0015 100%)',
          overflow: 'hidden',
        }}
      >
        {lines}
        {/* Flash layer */}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(255,220,100,${flash})` }} />
        {/* Thin red accent bars — anime OP signature */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '12%', height: 3, background: 'linear-gradient(90deg, transparent, #ff2244, transparent)', opacity: 0.7 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '12%', height: 3, background: 'linear-gradient(90deg, transparent, #ff2244, transparent)', opacity: 0.7 }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Anime mechanic: zoom from tiny (far away on speed lines) to normal, slight overshoot
    const easeOutBack = (t: number) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }

    let opacity = 0
    let scale = 1
    let translateY = 0
    let skewX = 0

    if (phase === 'enter') {
      const e = easeOutBack(Math.min(enterProgress * 1.2, 1))
      opacity = Math.min(enterProgress * 5, 1)
      scale = 0.05 + e * 0.95    // rockets from tiny
      translateY = (1 - Math.min(enterProgress * 1.2, 1)) * 30
      skewX = (1 - e) * -8       // slight italic lean on entry
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      translateY = 0
      skewX = 0
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      skewX = exitProgress * 5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) skewX(${skewX}deg)`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 4,
          color,
          whiteSpace: 'nowrap',
          textShadow: `
            0 0 20px ${color}88,
            3px 3px 0 rgba(0,0,0,0.8),
            -1px -1px 0 rgba(0,0,0,0.5)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function AnimeOpeningTitleComponent(props: MotionGraphicProps<AnimeOpeningTitleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anime-opening-title',
  title: 'Kinetic Anime Opening Title',
  description: 'Anime OP title card: text rockets in from vanishing point with speed lines, overshoot, and dramatic flash',
  tags: ['kinetic', 'typography', 'anime', 'opening', 'title', 'speed lines', 'zoom', 'dramatic', 'film'],
  category: 'captions',
  component: AnimeOpeningTitleComponent as any,
  defaultConfig: {
    words: ['SHONEN', 'RISE', 'POWER', 'LEGEND'],
    colors: ['#ff4466', '#ffcc00', '#00ccff', '#ff4466'],
    bgColor: '#0a0015',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHONEN', 'RISE', 'POWER', 'LEGEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff4466', '#ffcc00', '#00ccff', '#ff4466'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0015', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
  ],
})
