import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OpeningCreditsConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0

    if (phase === 'enter') {
      // Gentle, slow fade in — classic credits pacing
      opacity = enterProgress * enterProgress // ease-in (quadratic)
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      // Gentle fade out
      opacity = 1 - exitProgress * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Garamond', 'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(24px, 6vw, 80px)',
          fontWeight: 300,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function OpeningCreditsComponent(props: MotionGraphicProps<OpeningCreditsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-opening-credits',
  title: 'Kinetic Opening Credits',
  description:
    'Classic movie opening credits: thin elegant serif text fades in and out with generous timing against a dark background',
  tags: ['kinetic', 'typography', 'credits', 'opening', 'film', 'classic', 'elegant'],
  category: 'captions',
  component: OpeningCreditsComponent as any,
  defaultConfig: {
    words: ['A FILM BY', 'JOHN DOE', 'STARRING', 'JANE SMITH'],
    colors: ['#C8C8C8', '#FFFFFF', '#C8C8C8', '#FFFFFF'],
    bgColor: '#000000',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['A FILM BY', 'JOHN DOE', 'STARRING', 'JANE SMITH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C8C8C8', '#FFFFFF', '#C8C8C8', '#FFFFFF'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#000000',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 8,
      group: 'Timing',
    },
  ],
})
