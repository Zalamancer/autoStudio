import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlashTransitionConfig extends KineticBaseConfig {
  flashColor: string
  flashIntensity: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const flashOpacity =
      phase === 'enter'
        ? Math.max(0, 1 - easeOutCubic(enterProgress) * 2)
        : phase === 'exit'
          ? Math.max(0, exitProgress * 2 - 1)
          : 0

    const wordOpacity =
      phase === 'enter'
        ? enterProgress > 0.3
          ? Math.min(1, (enterProgress - 0.3) * 2.5)
          : 0
        : phase === 'exit'
          ? exitProgress < 0.5
            ? 1
            : 1 - (exitProgress - 0.5) * 2
          : 1

    const flareSize =
      phase === 'enter' ? 200 + (1 - enterProgress) * 400 : phase === 'exit' ? 200 + exitProgress * 400 : 0

    const flareOpacity = phase === 'enter' ? (1 - enterProgress) * 0.6 : phase === 'exit' ? exitProgress * 0.6 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Flash overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            opacity: flashOpacity,
            pointerEvents: 'none',
          }}
        />
        {/* Lens flare */}
        {flareOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: flareSize,
              height: flareSize,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(255,255,255,${flareOpacity}) 0%, rgba(255,200,100,${flareOpacity * 0.5}) 30%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: wordOpacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: '0 0 40px rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FlashTransitionComponent(props: MotionGraphicProps<FlashTransitionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flash-transition',
  title: 'Kinetic Flash Transition',
  description: 'Camera-flash reveal — screen flashes white as each word appears and disappears, with lens flare bloom',
  tags: ['kinetic', 'typography', 'transition', 'flash', 'dramatic'],
  category: 'captions',
  component: FlashTransitionComponent as any,
  defaultConfig: {
    words: ['FLASH', 'BANG', 'BOOM', 'POP'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#000000',
    cycleDuration: 1.5,
    flashColor: '#FFFFFF',
    flashIntensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLASH', 'BANG', 'BOOM'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'flashColor', label: 'Flash Color', type: 'color', defaultValue: '#FFFFFF', group: 'Animation' },
    {
      key: 'flashIntensity',
      label: 'Flash Intensity',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 2,
      group: 'Animation',
    },
  ],
})
