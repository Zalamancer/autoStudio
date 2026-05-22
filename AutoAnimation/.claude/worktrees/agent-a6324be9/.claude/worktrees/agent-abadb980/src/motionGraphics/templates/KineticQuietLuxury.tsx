import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Trending Aesthetic 2025: Clean Girl / Quiet Luxury
// Ultra-minimal serif reveal with generous tracking expansion — the aesthetic IS the restraint

interface QuietLuxuryConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#f5f0eb'
          ? 'linear-gradient(160deg, #f5f0eb 0%, #ede8e2 60%, #e8e3dc 100%)'
          : bgColor,
      }}
    >
      {/* Single hairline rule — the only decoration quiet luxury allows */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '50%',
          height: 0.5,
          background: 'rgba(120,110,100,0.15)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Tracking expansion: letters breathe open slowly — that IS quiet luxury
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

    let opacity = 0
    let letterSpacing = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      const e = easeOut(enterProgress)
      opacity = e
      letterSpacing = 2 + e * 18    // 2px → 20px tracking expansion
      translateY = (1 - e) * 12
      scale = 0.97 + e * 0.03
    } else if (phase === 'hold') {
      opacity = 1
      letterSpacing = 20
      translateY = 0
      scale = 1
    } else {
      const e = easeOut(exitProgress)
      opacity = 1 - e
      letterSpacing = 20 + e * 8    // continues drifting outward on exit
      scale = 1 + e * 0.01
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(20px, 5vw, 72px)',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: `${letterSpacing}px`,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function QuietLuxuryComponent(props: MotionGraphicProps<QuietLuxuryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-quiet-luxury',
  title: 'Kinetic Quiet Luxury',
  description: 'Clean girl / quiet luxury aesthetic: ultra-thin serif with slow tracking expansion on warm linen background',
  tags: ['kinetic', 'typography', 'quiet luxury', 'clean girl', 'minimal', 'serif', 'aesthetic', '2025'],
  category: 'captions',
  component: QuietLuxuryComponent as any,
  defaultConfig: {
    words: ['LESS', 'IS', 'MORE', 'ALWAYS'],
    colors: ['#5c5248', '#7a6f65', '#5c5248', '#9e9186'],
    bgColor: '#f5f0eb',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LESS', 'IS', 'MORE', 'ALWAYS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5c5248', '#7a6f65', '#5c5248', '#9e9186'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0eb', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
