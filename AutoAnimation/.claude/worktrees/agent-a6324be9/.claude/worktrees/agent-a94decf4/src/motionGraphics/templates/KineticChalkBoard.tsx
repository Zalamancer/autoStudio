import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle chalk dust texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.02) 0%, transparent 3%)',
            'radial-gradient(circle at 60% 70%, rgba(255,255,255,0.015) 0%, transparent 2%)',
            'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.02) 0%, transparent 4%)',
            'radial-gradient(circle at 40% 80%, rgba(255,255,255,0.01) 0%, transparent 3%)',
          ].join(', '),
        }}
      />
      {/* Chalkboard frame edge */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const totalChars = word.length
    const seed = index * 41 + 7

    if (phase === 'enter') {
      // Letter-by-letter reveal like writing on chalkboard
      const visibleChars = Math.floor(enterProgress * (totalChars + 1))
      const displayText = word.substring(0, visibleChars)
      const opacity = Math.min(1, enterProgress * 1.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 400,
            color,
            textShadow: `0 0 4px ${color}, 1px 1px 2px rgba(255,255,255,0.1)`,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {displayText}
        </div>
      )
    }

    if (phase === 'hold') {
      // Slight wobble like hand-drawn imperfection
      const wobbleX = Math.sin(Date.now() * 0.003 + seed) * 1.5
      const wobbleRotation = Math.sin(Date.now() * 0.004 + seed * 2) * 0.5

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${wobbleX}px), -50%) rotate(${wobbleRotation}deg)`,
            opacity: 1,
            fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 400,
            color,
            textShadow: `0 0 4px ${color}, 1px 1px 2px rgba(255,255,255,0.1)`,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: eraser wipe - opacity fade with slight blur
    const opacity = 1 - exitProgress
    const blur = exitProgress * 6

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 400,
          color,
          textShadow: `0 0 4px ${color}, 1px 1px 2px rgba(255,255,255,0.1)`,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
        }}
      >
        {word}
      </div>
    )
  },
}

function ChalkBoardComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chalk-board',
  title: 'Kinetic Chalk Board',
  description: 'Chalkboard writing with letter-by-letter reveal, hand-drawn wobble, and eraser wipe exit',
  tags: ['kinetic', 'typography', 'chalk', 'chalkboard', 'handwritten', 'school'],
  category: 'captions',
  component: ChalkBoardComponent as any,
  defaultConfig: {
    words: ['LEARN', 'THINK', 'GROW', 'CREATE'],
    colors: ['#FFFFFF', '#FFD700', '#FF6B6B', '#90EE90'],
    bgColor: '#2a4a2a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEARN', 'THINK', 'GROW', 'CREATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FF6B6B', '#90EE90'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a4a2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
