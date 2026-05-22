import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CatapultLaunchConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Parabolic arc: text launched from bottom-left on an arc, lands center
// arc height peaks at t=0.5, x travels linearly
function getArcPosition(t: number, width: number, height: number): { x: number; y: number; rotate: number } {
  // Start: bottom-left off-screen
  const startX = -width * 0.7
  const startY = height * 0.5
  // End: center
  const endX = 0
  const endY = 0

  const ease = easeOutCubic(t)

  const x = startX + (endX - startX) * ease
  // Parabolic Y: goes up, then comes down to center
  const arcPeakY = -height * 0.35
  const linearY = startY + (endY - startY) * ease
  const arcY = linearY + arcPeakY * 4 * t * (1 - t)

  // Rotation: starts spinning (catapulted), decelerates to upright
  const rotate = (1 - ease) * -400 // starts at -400deg (spinning), ends at 0

  return { x, y: arcY, rotate }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Arc trajectory guide (faint) */}
        {Array.from({ length: 20 }, (_, i) => {
          const t = i / 19
          const ease = easeOutCubic(t)
          const x = width * (-0.7 + ease * 0.7) + width / 2
          const startY = height * 0.5
          const arcPeakY = -height * 0.35
          const linearY = startY + (0 - startY) * ease
          const arcY = linearY + arcPeakY * 4 * t * (1 - t)
          const y = height / 2 + arcY
          const pulse = 0.08 + Math.sin(time * 3 + t * 8) * 0.04
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: `rgba(255,200,50,${pulse})`,
              }}
            />
          )
        })}
        {/* Launch zone indicator at bottom-left */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            bottom: '15%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: `2px solid rgba(255,180,0,${0.2 + Math.sin(time * 4) * 0.1})`,
            boxShadow: `0 0 20px rgba(255,180,0,${0.1 + Math.sin(time * 3) * 0.05})`,
          }}
        />
      </div>
    )
  },

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
    let shakeX = 0
    let shakeY = 0

    if (phase === 'enter') {
      if (enterProgress < 0.75) {
        // Arc trajectory phase
        const t = enterProgress / 0.75
        const pos = getArcPosition(t, width, height)
        translateX = pos.x
        translateY = pos.y
        rotate = pos.rotate
        opacity = Math.min(1, enterProgress * 5)

        // Stretch during flight
        const speed = Math.abs(1 - easeOutCubic(t)) // high at start, low at end
        scaleY = 1 + speed * 0.3
        scaleX = 1 - speed * 0.15
      } else {
        // Landing: squash and screen shake on impact
        const impactT = (enterProgress - 0.75) / 0.25
        translateX = 0
        translateY = 0
        rotate = 0

        const squash = Math.exp(-impactT * 8) * Math.sin(impactT * 25)
        scaleX = 1 + squash * 0.45
        scaleY = 1 - squash * 0.32

        if (impactT < 0.5) {
          const shakeAmp = (1 - impactT / 0.5) * 15
          shakeX = Math.sin(f * 3.5) * shakeAmp
          shakeY = Math.cos(f * 2.9) * shakeAmp * 0.7
        }
      }
    } else if (phase === 'hold') {
      // Settled — gentle landing resonance
      const vib = Math.exp(-holdProgress * 10) * Math.sin(holdProgress * 40) * 3
      shakeX = vib
      scaleX = 1 + Math.exp(-holdProgress * 7) * 0.07
      scaleY = 1 - Math.exp(-holdProgress * 7) * 0.05
      opacity = 1
    } else {
      // Exit: launches off to the right on another arc
      const t = easeInCubic(exitProgress)
      translateX = t * width * 0.9
      translateY = -(exitProgress * (1 - exitProgress)) * height * 0.5 // parabolic exit
      rotate = t * 360
      scaleY = 1 + t * 0.25
      scaleX = 1 - t * 0.15
      opacity = 1 - exitProgress * 1.5
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
            textShadow: `4px 4px 0 rgba(0,0,0,0.6), 0 0 30px ${color}70`,
            filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.7))`,
          }}
        >
          {word}
        </div>
        {/* Flight trail */}
        {phase === 'enter' && enterProgress < 0.7 && enterProgress > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX - 40}px), calc(-50% + ${translateY + 15}px)) rotate(${rotate - 30}deg)`,
              opacity: opacity * 0.12,
              filter: 'blur(8px)',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(48px, 13vw, 180px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        )}
      </div>
    )
  },
}

function CatapultLaunchComponent(props: MotionGraphicProps<CatapultLaunchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-catapult-launch',
  title: 'Kinetic Catapult Launch',
  description:
    'Text launches from bottom-left on a parabolic arc with rotation, lands at center with impact squash and screen shake. Trajectory dots visible.',
  tags: ['kinetic', 'typography', 'catapult', 'launch', 'arc', 'parabola', 'physics', 'energy'],
  category: 'captions',
  component: CatapultLaunchComponent as any,
  defaultConfig: {
    words: ['LAUNCH!', 'FIRE!', 'AWAY', 'FLY'],
    colors: ['#FFAA00', '#FF4422', '#44FFAA', '#FF44FF'],
    bgColor: '#080c14',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LAUNCH!', 'FIRE!', 'AWAY', 'FLY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFAA00', '#FF4422', '#44FFAA', '#FF44FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
