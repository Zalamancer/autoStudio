import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KaraokeHighlightConfig extends KineticBaseConfig {
  highlightColor: string
  baseTextColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let fillPercent = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 4)
      fillPercent = easeOutCubic(enterProgress) * 100
    } else if (phase === 'hold') {
      opacity = 1
      fillPercent = 100
    } else {
      opacity = 1 - easeInCubic(exitProgress)
      fillPercent = (1 - easeOutCubic(exitProgress)) * 100
    }

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(44px, 13vw, 170px)',
      fontWeight: 800,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    }

    return (
      <div style={{ opacity }}>
        {/* Base text (unhighlighted) */}
        <div
          style={{
            ...baseStyle,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {word}
        </div>
        {/* Highlighted fill sweeping left to right */}
        <div
          style={{
            ...baseStyle,
            color,
            clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function KaraokeHighlightComponent(props: MotionGraphicProps<KaraokeHighlightConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-karaoke-highlight',
  title: 'Kinetic Karaoke Highlight',
  description: 'Karaoke-style text with color highlight sweeping left-to-right across each word',
  tags: ['kinetic', 'typography', 'karaoke', 'highlight', 'sweep', 'lyrics'],
  category: 'captions',
  component: KaraokeHighlightComponent as any,
  defaultConfig: {
    words: ['FOLLOW', 'YOUR', 'HEART', 'ALWAYS'],
    colors: ['#FFD700', '#FFD700', '#FFD700', '#FFD700'],
    bgColor: '#0F1A2E',
    cycleDuration: 1,
    highlightColor: '#FFD700',
    baseTextColor: 'rgba(255,255,255,0.3)',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOLLOW', 'YOUR', 'HEART', 'ALWAYS'], group: 'Content' },
    { key: 'colors', label: 'Highlight Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFD700', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1A2E', group: 'Style' },
    { key: 'highlightColor', label: 'Highlight Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'baseTextColor', label: 'Base Text Color', type: 'color', defaultValue: 'rgba(255,255,255,0.3)', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
