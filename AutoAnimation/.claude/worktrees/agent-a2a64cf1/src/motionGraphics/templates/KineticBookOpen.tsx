import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BookOpenConfig extends KineticBaseConfig {
  coverColor: string
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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__bookOpenConfig ?? { coverColor: '#8B4513' }
    const coverColor = config.coverColor ?? '#8B4513'

    let openAngle = 0 // 0 = closed, 180 = fully open
    let textOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      openAngle = 180 * eased
      textOpacity = Math.min(1, (enterProgress - 0.3) / 0.7)
    } else if (phase === 'hold') {
      openAngle = 180
      textOpacity = 1
    } else {
      const eased = easeInCubic(exitProgress)
      openAngle = 180 * (1 - eased)
      textOpacity = Math.max(0, 1 - exitProgress * 2)
    }

    // Left cover: rotates from 0deg to -90deg (opens left)
    // Right cover: rotates from 0deg to +90deg (opens right)
    // openAngle 0 = covers flat (both at 0, stacked). openAngle 180 = both swung fully open.
    const coverAngle = Math.min(90, openAngle)

    // As covers open, shadow lessens
    const shadowOpacity = (1 - coverAngle / 90) * 0.5

    // Page shadow/depth — visible in the center gap as pages are exposed
    const spineWidth = Math.max(4, width * 0.015)

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: 1000,
        }}
      >
        {/* Text (the open pages reveal) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: Math.max(0, textOpacity),
          }}
        >
          {word}
        </div>

        {/* Left page background (paper) */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: 0,
            width: '50%',
            height: '90%',
            background: 'linear-gradient(90deg, rgba(245,240,230,0.06) 0%, rgba(250,245,235,0.1) 100%)',
            opacity: coverAngle / 90,
          }}
        />

        {/* Right page background (paper) */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: 0,
            width: '50%',
            height: '90%',
            background: 'linear-gradient(270deg, rgba(245,240,230,0.06) 0%, rgba(250,245,235,0.1) 100%)',
            opacity: coverAngle / 90,
          }}
        />

        {/* Left cover — rotates from center spine outward to the left */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: 0,
            width: `calc(50% - ${spineWidth / 2}px)`,
            height: '90%',
            transformOrigin: 'right center',
            transform: `perspective(1000px) rotateY(${coverAngle}deg)`,
            background: `linear-gradient(90deg, ${coverColor}ee 0%, ${coverColor}cc 100%)`,
            backfaceVisibility: 'hidden',
            boxShadow: shadowOpacity > 0.02 ? `inset -8px 0 20px rgba(0,0,0,${shadowOpacity})` : 'none',
          }}
        >
          {/* Cover texture lines */}
          {[0.25, 0.5, 0.75].map((pos, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${pos * 100}%`,
                top: '10%',
                width: 1,
                height: '80%',
                background: `rgba(0,0,0,0.08)`,
              }}
            />
          ))}
        </div>

        {/* Right cover — rotates from center spine outward to the right */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: 0,
            width: `calc(50% - ${spineWidth / 2}px)`,
            height: '90%',
            transformOrigin: 'left center',
            transform: `perspective(1000px) rotateY(${-coverAngle}deg)`,
            background: `linear-gradient(270deg, ${coverColor}ee 0%, ${coverColor}cc 100%)`,
            backfaceVisibility: 'hidden',
            boxShadow: shadowOpacity > 0.02 ? `inset 8px 0 20px rgba(0,0,0,${shadowOpacity})` : 'none',
          }}
        >
          {[0.25, 0.5, 0.75].map((pos, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${pos * 100}%`,
                top: '10%',
                width: 1,
                height: '80%',
                background: `rgba(0,0,0,0.08)`,
              }}
            />
          ))}
        </div>

        {/* Spine */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: `calc(50% - ${spineWidth / 2}px)`,
            width: spineWidth,
            height: '90%',
            background: `linear-gradient(180deg, ${coverColor}ff, ${coverColor}bb)`,
            boxShadow: `0 0 8px rgba(0,0,0,0.4)`,
          }}
        />
      </div>
    )
  },
}

function BookOpenComponent(props: MotionGraphicProps<BookOpenConfig>) {
  ;(globalThis as any).__bookOpenConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-book-open',
  title: 'Kinetic Book Open',
  description: 'Book covers swing open from the center spine with 3D perspective to reveal text on the pages',
  tags: ['kinetic', 'typography', 'book', 'open', 'reveal', '3d', 'pages', 'mechanical', 'geometric'],
  category: 'captions',
  component: BookOpenComponent as any,
  defaultConfig: {
    words: ['READ', 'OPEN', 'CHAPTER', 'STORY'],
    colors: ['#FEF9ED', '#FDF6E3', '#FFFBF0', '#FAF3DC'],
    bgColor: '#1a1208',
    cycleDuration: 1.8,
    coverColor: '#7C3F1E',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['READ', 'OPEN', 'CHAPTER', 'STORY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FEF9ED', '#FDF6E3', '#FFFBF0', '#FAF3DC'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1208', group: 'Style' },
    { key: 'coverColor', label: 'Cover Color', type: 'color', defaultValue: '#7C3F1E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
