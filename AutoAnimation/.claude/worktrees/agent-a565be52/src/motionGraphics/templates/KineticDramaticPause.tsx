import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DramaticPauseConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0

    if (phase === 'enter') {
      // Extra slow fade in for dramatic tension
      opacity = Math.pow(enterProgress, 2.5) // very gradual ease-in
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      // Slow fade out
      opacity = 1 - Math.pow(exitProgress, 1.5)
    }

    // Animated ellipsis between words — shows during exit phase
    const dotsOpacity = phase === 'exit' ? Math.min(1, exitProgress * 3) : 0
    const dotCount = phase === 'exit' ? Math.min(3, Math.floor(exitProgress * 6) + 1) : 0
    const dots = '.'.repeat(dotCount)

    return (
      <>
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            color,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Dramatic ellipsis */}
        {dotsOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '62%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: dotsOpacity * 0.5,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(28px, 7vw, 80px)',
              fontWeight: 300,
              letterSpacing: '0.5em',
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {dots}
          </div>
        )}
      </>
    )
  },
}

function DramaticPauseComponent(props: MotionGraphicProps<DramaticPauseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dramatic-pause',
  title: 'Kinetic Dramatic Pause',
  description:
    'Text with dramatic pauses — extra slow fade transitions with animated ellipsis between words for maximum tension',
  tags: ['kinetic', 'typography', 'dramatic', 'pause', 'tension', 'cinematic', 'slow'],
  category: 'captions',
  component: DramaticPauseComponent as any,
  defaultConfig: {
    words: ['WHAT IF', 'EVERYTHING', 'YOU KNEW', 'WAS WRONG'],
    colors: ['#D0D0D0', '#FFFFFF', '#D0D0D0', '#FFFFFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WHAT IF', 'EVERYTHING', 'YOU KNEW', 'WAS WRONG'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D0D0D0', '#FFFFFF', '#D0D0D0', '#FFFFFF'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#0a0a0a',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 10,
      group: 'Timing',
    },
  ],
})
