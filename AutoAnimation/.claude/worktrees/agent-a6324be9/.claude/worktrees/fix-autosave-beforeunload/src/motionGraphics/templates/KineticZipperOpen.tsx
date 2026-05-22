import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZipperOpenConfig extends KineticBaseConfig {
  toothCount: number
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
    const config = (globalThis as any).__zipperConfig ?? { toothCount: 16 }
    const toothCount = config.toothCount ?? 16

    // Zipper opens top-to-bottom: the pull tab descends, teeth part left and right
    let pullProgress = 0 // how far down the zipper pull has traveled (0=top, 1=bottom)

    if (phase === 'enter') {
      pullProgress = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      pullProgress = 1
    } else {
      pullProgress = 1 - easeInCubic(exitProgress)
    }

    const pullY = pullProgress * height
    const toothHeight = height / toothCount
    const centerX = width / 2
    const gapHalf = 28 * pullProgress // how far teeth separate at any point already passed

    // Build zipper teeth
    const toothElements = []
    for (let i = 0; i < toothCount; i++) {
      const toothY = i * toothHeight
      const toothMidY = toothY + toothHeight / 2
      // If pull has passed this tooth, it's open
      const isOpen = toothMidY < pullY
      const localGap = isOpen ? gapHalf : 0

      // Left tooth
      toothElements.push(
        <div
          key={`L${i}`}
          style={{
            position: 'absolute',
            top: toothY + 1,
            left: centerX - 10 - localGap,
            width: 10,
            height: toothHeight - 2,
            background: isOpen
              ? 'linear-gradient(90deg, #6a6a7a, #8a8a9a)'
              : 'linear-gradient(90deg, #9a9aaa, #b0b0c0)',
            borderRadius: '3px 0 0 3px',
            boxShadow: isOpen ? 'none' : '1px 0 3px rgba(0,0,0,0.3)',
            transition: 'none',
          }}
        />,
      )

      // Right tooth
      toothElements.push(
        <div
          key={`R${i}`}
          style={{
            position: 'absolute',
            top: toothY + 1,
            left: centerX + localGap,
            width: 10,
            height: toothHeight - 2,
            background: isOpen
              ? 'linear-gradient(270deg, #6a6a7a, #8a8a9a)'
              : 'linear-gradient(270deg, #9a9aaa, #b0b0c0)',
            borderRadius: '0 3px 3px 0',
            boxShadow: isOpen ? 'none' : '-1px 0 3px rgba(0,0,0,0.3)',
          }}
        />,
      )
    }

    // Zipper pull tab — the diamond-shaped slider
    const tabSize = 20
    const tabY = pullY - tabSize

    // Text revealed behind the opening zipper
    const textOpacity = Math.min(1, pullProgress * 1.8)

    return (
      <>
        {/* Text behind zipper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>

        {/* Zipper teeth */}
        {toothElements}

        {/* Zipper tape — vertical center line */}
        {pullProgress < 1 && (
          <div
            style={{
              position: 'absolute',
              top: pullY,
              left: centerX - 1,
              width: 2,
              height: height - pullY,
              background: 'linear-gradient(180deg, #b0b0c0, #888898)',
              opacity: 0.7,
            }}
          />
        )}

        {/* Pull tab */}
        <div
          style={{
            position: 'absolute',
            left: centerX - tabSize,
            top: Math.max(0, tabY),
            width: tabSize * 2,
            height: tabSize,
            background: 'linear-gradient(135deg, #e0e0e8, #888898)',
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
            opacity: pullProgress > 0.02 ? 1 : 0,
          }}
        />
      </>
    )
  },
}

function ZipperOpenComponent(props: MotionGraphicProps<ZipperOpenConfig>) {
  ;(globalThis as any).__zipperConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zipper-open',
  title: 'Kinetic Zipper Open',
  description: 'A vertical zipper pulls open from top to bottom, teeth parting left and right to reveal text',
  tags: ['kinetic', 'typography', 'zipper', 'reveal', 'mechanical', 'everyday', 'split'],
  category: 'captions',
  component: ZipperOpenComponent as any,
  defaultConfig: {
    words: ['UNZIP', 'OPEN', 'REVEAL', 'PULL'],
    colors: ['#FF6B9D', '#C084FC', '#34D399', '#F59E0B'],
    bgColor: '#0d0d1a',
    cycleDuration: 1.6,
    toothCount: 16,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['UNZIP', 'OPEN', 'REVEAL', 'PULL'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#C084FC', '#34D399', '#F59E0B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'toothCount', label: 'Zipper Teeth', type: 'number', defaultValue: 16, min: 8, max: 32, group: 'Animation' },
  ],
})
