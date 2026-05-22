import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThrowCatchConfig extends KineticBaseConfig {}

// Easing: ease-out cubic
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Easing: ease-in cubic
function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    let translateX = 0
    let translateY = 0
    let rotate = 0
    let opacity = 1
    let scaleX = 1
    let scaleY = 1
    // Shake applied to outer container
    let shakeX = 0
    let shakeY = 0

    if (phase === 'enter') {
      // Text hurled in from the left, spinning, decelerates hard to center
      const t = easeOutCubic(enterProgress)
      // Start off-screen left, arrive at center
      translateX = (1 - t) * -width * 0.9
      // Arc trajectory — slight upward then down
      translateY = Math.sin(enterProgress * Math.PI) * -height * 0.18
      // Spinning during throw: rotation settles from -720 to 0
      rotate = (1 - t) * -540
      opacity = Math.min(1, enterProgress * 5)

      // Impact squash on arrival (last 15%)
      if (enterProgress > 0.85) {
        const impact = (enterProgress - 0.85) / 0.15
        scaleX = 1 + impact * 0.35
        scaleY = 1 - impact * 0.25
        shakeX = Math.sin(f * 2.3) * 8 * (1 - impact)
        shakeY = Math.cos(f * 1.8) * 6 * (1 - impact)
      }
    } else if (phase === 'hold') {
      // Settled — small rebound then stable with slight vibration
      const rebound = Math.exp(-holdProgress * 12) * Math.sin(holdProgress * 40) * 5
      translateX = rebound
      translateY = 0
      scaleX = 1 + Math.exp(-holdProgress * 8) * 0.12
      scaleY = 1 - Math.exp(-holdProgress * 8) * 0.09
      opacity = 1
    } else {
      // Exit: snapped away to the right as if caught and thrown again
      const t = easeInCubic(exitProgress)
      translateX = t * width * 1.1
      translateY = -t * height * 0.22
      rotate = t * 360
      scaleX = 1 - t * 0.3
      scaleY = 1 + t * 0.2
      opacity = 1 - exitProgress * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center center',
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 180px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: `4px 4px 0 rgba(0,0,0,0.5), 0 0 30px ${color}60`,
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
          }}
        >
          {word}
        </div>
        {/* Motion blur trail during enter */}
        {phase === 'enter' && enterProgress < 0.8 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX + (1 - enterProgress) * -60}px), calc(-50% + ${translateY}px)) rotate(${rotate + 15}deg)`,
              opacity: opacity * 0.15,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(48px, 13vw, 180px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              filter: 'blur(6px)',
            }}
          >
            {word}
          </div>
        )}
      </div>
    )
  },
}

function ThrowCatchComponent(props: MotionGraphicProps<ThrowCatchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-throw-catch',
  title: 'Kinetic Throw Catch',
  description:
    'Text hurled in from off-screen with spin, arc trajectory, and hard-stop impact catch. Screen shake on landing, snapped away on exit.',
  tags: ['kinetic', 'typography', 'throw', 'catch', 'physics', 'impact', 'energy', 'force'],
  category: 'captions',
  component: ThrowCatchComponent as any,
  defaultConfig: {
    words: ['CATCH!', 'FIRE', 'GO!', 'NOW'],
    colors: ['#FF4444', '#FF9F00', '#00E5FF', '#FF44FF'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CATCH!', 'FIRE', 'GO!', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF9F00', '#00E5FF', '#FF44FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
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
