import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Era Aesthetic: Y2K Chrome Revival (2025 trend)
// Liquid chrome metallic text. Iridescent gradient background that
// shifts between silver/blue/magenta. Words enter with a chrome
// reflection wipe from left — like a car door being opened.
// Hold: text shimmers with a moving specular highlight sweep.
// Exit: chrome melts to liquid and drips down.

interface Y2KChromeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const angle = (time * 20) % 360

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#0a0a1a'
            ? `linear-gradient(${angle * 0.3}deg, #0a0a1a 0%, #1a0a2a 50%, #0a0a1a 100%)`
            : bgColor,
        }}
      >
        {/* Iridescent chrome shimmer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              `linear-gradient(${angle}deg, rgba(180,180,255,0.06) 0%, rgba(255,180,255,0.06) 33%, rgba(180,255,255,0.06) 66%, rgba(180,180,255,0.06) 100%)`,
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
        {/* Metallic grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'repeating-linear-gradient(0deg, rgba(200,200,255,0.04) 0px, rgba(200,200,255,0.04) 1px, transparent 1px, transparent 40px)',
              'repeating-linear-gradient(90deg, rgba(200,200,255,0.04) 0px, rgba(200,200,255,0.04) 1px, transparent 1px, transparent 40px)',
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let clipLeft = 100
    let translateY = 0

    if (phase === 'enter') {
      // Chrome reflection wipe from left
      opacity = Math.min(enterProgress / 0.1, 1)
      clipLeft = (1 - enterProgress) * 100
    } else if (phase === 'hold') {
      opacity = 1
      clipLeft = 0
    } else {
      // Drip down dissolve
      opacity = 1 - exitProgress
      translateY = exitProgress * 30
      clipLeft = 0
    }

    // Specular highlight sweep across text during hold
    const specularPos = phase === 'hold'
      ? (Date.now() / 2000) % 1 * 150 - 25
      : phase === 'enter'
        ? enterProgress * 150
        : -25

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          clipPath: `inset(0 ${clipLeft}% 0 0)`,
          position: 'relative' as any,
        }}
      >
        {/* Base chrome text */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 165px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            // Chrome gradient
            background: `linear-gradient(180deg, #ffffff 0%, #c0c8e0 25%, #8090b8 50%, #c0c8e0 75%, #ffffff 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            filter: 'drop-shadow(0 2px 6px rgba(150,160,255,0.4))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {word}
          {/* Specular sweep overlay */}
          {phase !== 'exit' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${specularPos}%`,
                width: '25%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function Y2KChromeComponent(props: MotionGraphicProps<Y2KChromeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-y2k-chrome',
  title: 'Kinetic Y2K Chrome',
  description: 'Y2K chrome revival — liquid chrome gradient text, specular highlight sweep, iridescent bg, reflection wipe entrance',
  tags: ['kinetic', 'typography', 'y2k', 'chrome', 'metallic', 'iridescent', 'era', '2025'],
  category: 'captions',
  component: Y2KChromeComponent as any,
  defaultConfig: {
    words: ['CYBER', 'CHROME', 'FUTURE', 'METALLIC'],
    colors: ['#c0c8e0', '#8090b8', '#c0c8e0', '#8090b8'],
    bgColor: '#0a0a1a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CYBER', 'CHROME', 'FUTURE', 'METALLIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#c0c8e0', '#8090b8', '#c0c8e0', '#8090b8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
