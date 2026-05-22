import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Community: BookTok
// Warm amber library tones. Words enter as individual ink bleed-in —
// opacity rises with a slight warm diffusion glow, like ink hitting
// cream pages. A thin horizontal rule animates in under the word
// during hold (like an underline annotation). Exit: gentle ink fade.

interface BookTokSerifConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Page turn light shimmer
    const shimmer = Math.sin(time * 0.4) * 0.04 + 0.04

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#fdf8f0'
            ? 'linear-gradient(160deg, #fdf8f0 0%, #f8f0e0 60%, #f3e8d0 100%)'
            : bgColor,
        }}
      >
        {/* Warm page light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 30% 20%, rgba(255,200,100,${shimmer}) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Book page lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 36px, rgba(139,100,60,0.05) 36px, rgba(139,100,60,0.05) 37px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let inkBlur = 0

    if (phase === 'enter') {
      // Ink bleed — blur dissolves to sharp
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      inkBlur = (1 - eased) * 6
    } else if (phase === 'hold') {
      opacity = 1
      inkBlur = 0
    } else {
      const eased = Math.pow(exitProgress, 1.5)
      opacity = 1 - eased
      inkBlur = eased * 4
    }

    // Annotation underline
    const annotationProgress = phase === 'hold'
      ? Math.min(holdProgress * 3, 1)
      : phase === 'exit' ? 1 - exitProgress : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: inkBlur > 0.5 ? `blur(${inkBlur}px)` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Georgia', serif",
            fontSize: 'clamp(32px, 8vw, 115px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 4,
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
            color,
            textShadow: '0 1px 2px rgba(80,40,0,0.08)',
          }}
        >
          {word}
        </div>
        {/* Annotation line — amber ink */}
        <div
          style={{
            width: `${annotationProgress * 100}%`,
            height: 1.5,
            background: 'rgba(180,120,40,0.6)',
            borderRadius: 1,
          }}
        />
      </div>
    )
  },
}

function BookTokSerifComponent(props: MotionGraphicProps<BookTokSerifConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-booktok-serif',
  title: 'Kinetic BookTok Serif',
  description: 'BookTok community aesthetic — warm amber library, italic Palatino ink bleed-in, amber annotation underline',
  tags: ['kinetic', 'typography', 'booktok', 'serif', 'library', 'books', 'warm', 'community'],
  category: 'captions',
  component: BookTokSerifComponent as any,
  defaultConfig: {
    words: ['chapter one', 'plot twist', 'book hangover', 'obsessed'],
    colors: ['#4a2e0a', '#4a2e0a', '#4a2e0a', '#4a2e0a'],
    bgColor: '#fdf8f0',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['chapter one', 'plot twist', 'book hangover', 'obsessed'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4a2e0a', '#4a2e0a', '#4a2e0a', '#4a2e0a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fdf8f0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
