import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DarkAcademiaConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#f5eed6'
          ? 'linear-gradient(135deg, #f5eed6 0%, #e8dcc4 50%, #f0e6ce 100%)'
          : bgColor,
      }}
    >
      {/* Aged parchment texture via noise pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 20% 30%, rgba(139,90,43,0.06) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 70%, rgba(139,90,43,0.08) 0%, transparent 40%)',
            'radial-gradient(circle at 50% 50%, rgba(139,90,43,0.04) 0%, transparent 60%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
      {/* Vignette — aged edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(80,50,20,0.25) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Subtle horizontal lines like old paper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139,90,43,0.04) 28px, rgba(139,90,43,0.04) 29px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    // Typewriter-style reveal — character by character
    const totalChars = word.length

    if (phase === 'enter') {
      const charsVisible = Math.floor(enterProgress * (totalChars + 1))
      const displayWord = word.substring(0, Math.min(charsVisible, totalChars))
      opacity = Math.min(enterProgress / 0.15, 1)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 3,
            color,
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {displayWord}
          {charsVisible <= totalChars && (
            <span style={{ opacity: 0.6, fontStyle: 'normal' }}>|</span>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      opacity = 1
      // Elegant, still hold with very subtle breathing
      const breathe = Math.sin(Date.now() * 0.001 + index) * 0.02

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + breathe})`,
            opacity,
            fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 3,
            color,
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * -15

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px)`,
            opacity,
            fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 3,
            color,
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            // Sepia tinting on exit
            filter: `sepia(${exitProgress * 0.4})`,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function DarkAcademiaComponent(props: MotionGraphicProps<DarkAcademiaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dark-academia',
  title: 'Kinetic Dark Academia',
  description: 'Dark academia aesthetic with serif font, aged parchment, typewriter reveal, vignette, and sepia toning',
  tags: ['kinetic', 'typography', 'dark-academia', 'scholarly', 'vintage', 'parchment', 'aesthetic'],
  category: 'captions',
  component: DarkAcademiaComponent as any,
  defaultConfig: {
    words: ['TRUTH', 'WISDOM', 'PROSE', 'LIGHT'],
    colors: ['#3b2514', '#3b2514', '#3b2514', '#3b2514'],
    bgColor: '#f5eed6',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRUTH', 'WISDOM', 'PROSE', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3b2514', '#3b2514', '#3b2514', '#3b2514'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5eed6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
