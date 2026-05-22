import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InkQuillConfig extends KineticBaseConfig {}

// Deterministic ink splash positions
const INK_SPLASHES = Array.from({ length: 8 }).map((_, i) => ({
  x: ((i * 43 + 11) % 80) + 10,
  y: ((i * 57 + 19) % 80) + 10,
  size: 3 + (i % 4) * 2,
  delay: i * 0.12,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(170deg, #f5edd6 0%, ${bgColor} 40%, #e8dcc4 100%)`,
        }}
      >
        {/* Parchment texture lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139,109,76,0.08) 28px, rgba(139,109,76,0.08) 29px)',
          }}
        />
        {/* Aged paper stain */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(160,132,92,0.1) 0%, transparent 70%)',
          }}
        />
        {/* Quill nib indicator at top right */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            right: '8%',
            fontSize: 'clamp(20px, 4vw, 36px)',
            opacity: 0.3 + Math.sin(time * 2) * 0.1,
            transform: `rotate(${-30 + Math.sin(time * 1.5) * 5}deg)`,
          }}
        >
          {'\u270D'}
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    holdProgress,
    width: canvasWidth,
  }: WordRenderProps) => {
    let opacity = 0
    let clipPercent = 100
    let inkOpacity = 0
    let quillX = 0

    if (phase === 'enter') {
      // Quill writes text left to right
      const writeProgress = Math.min(1, enterProgress * 1.3)
      const eased = 1 - Math.pow(1 - writeProgress, 2)
      clipPercent = (1 - eased) * 100
      opacity = Math.min(1, enterProgress * 3)
      quillX = eased * 100
      // Ink splashes appear as quill writes
      inkOpacity = enterProgress > 0.3 ? Math.min(1, (enterProgress - 0.3) * 3) : 0
    } else if (phase === 'hold') {
      opacity = 1
      clipPercent = 0
      inkOpacity = 1 - holdProgress * 0.7
      // Subtle ink shimmer
      quillX = 100
    } else {
      // Ink fades and blots
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      clipPercent = 0
      inkOpacity = 0
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Ink splashes */}
        {INK_SPLASHES.map((splash, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${splash.x - 50}%`,
              top: `${splash.y - 50}%`,
              width: splash.size,
              height: splash.size,
              borderRadius: '50%',
              background: `rgba(30,20,10,${inkOpacity * 0.4})`,
              transform: `scale(${inkOpacity})`,
            }}
          />
        ))}
        {/* Text drawn by quill */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${clipPercent}% 0 0)`,
            textShadow: '1px 1px 2px rgba(60,40,20,0.2)',
          }}
        >
          {word}
        </div>
        {/* Quill cursor */}
        {phase === 'enter' && (
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: `${quillX}%`,
              width: 3,
              height: '40%',
              background: `linear-gradient(180deg, transparent, rgba(80,50,20,0.6))`,
              transform: 'rotate(-15deg)',
              opacity: enterProgress < 0.95 ? 0.8 : 0,
            }}
          />
        )}
        {/* Ink line under text */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: 0,
            width: `${100 - clipPercent}%`,
            height: 2,
            background: `linear-gradient(90deg, ${color}40, ${color}15)`,
          }}
        />
      </div>
    )
  },
}

function InkQuillComponent(props: MotionGraphicProps<InkQuillConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ink-quill',
  title: 'Kinetic Ink Quill',
  description:
    'Text is drawn by an animated quill pen with ink splashes on parchment paper, literary handwriting effect',
  tags: ['kinetic', 'typography', 'ink', 'quill', 'pen', 'writing', 'literary', 'book', 'literature'],
  category: 'captions',
  component: InkQuillComponent as any,
  defaultConfig: {
    words: ['WRITE', 'INK', 'QUILL', 'VERSE'],
    colors: ['#2C1810', '#3D2B1F', '#1A0F08', '#4A3728'],
    bgColor: '#f0e6d0',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WRITE', 'INK', 'QUILL', 'VERSE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#2C1810', '#3D2B1F', '#1A0F08', '#4A3728'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0e6d0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
