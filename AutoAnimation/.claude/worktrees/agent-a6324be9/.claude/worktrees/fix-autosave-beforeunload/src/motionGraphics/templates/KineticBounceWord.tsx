import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BounceWordConfig extends KineticBaseConfig {}

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
    height,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scaleX = 1
    let scaleY = 1

    // Landing position: 65% from top (near bottom area)
    const groundY = height * 0.15
    // Drop height
    const dropHeight = height * 0.6

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 4)

      // Multi-bounce simulation: 4 bounces with decreasing height
      // Map enterProgress to bounces
      const bounceHeights = [1, 0.5, 0.25, 0.1]
      const bounceDurations = [0.4, 0.25, 0.2, 0.15]
      const totalDur = bounceDurations.reduce((a, b) => a + b, 0)

      let elapsed = enterProgress * totalDur
      let currentBounce = 0
      let bounceLocalT = 0

      for (let b = 0; b < bounceHeights.length; b++) {
        if (elapsed <= bounceDurations[b]) {
          currentBounce = b
          bounceLocalT = elapsed / bounceDurations[b]
          break
        }
        elapsed -= bounceDurations[b]
        if (b === bounceHeights.length - 1) {
          currentBounce = b
          bounceLocalT = 1
        }
      }

      // Parabolic arc for current bounce
      const arcHeight = bounceHeights[currentBounce] * dropHeight
      const arc = 4 * bounceLocalT * (1 - bounceLocalT)
      translateY = groundY - arc * arcHeight

      // Squash at bottom of each bounce
      if (bounceLocalT > 0.85 || bounceLocalT < 0.15) {
        const squashIntensity = bounceHeights[currentBounce]
        const squashT = bounceLocalT > 0.85
          ? (bounceLocalT - 0.85) / 0.15
          : 1 - bounceLocalT / 0.15
        scaleX = 1 + squashT * 0.25 * squashIntensity
        scaleY = 1 - squashT * 0.2 * squashIntensity
      }

      // Stretch while in air
      if (bounceLocalT > 0.3 && bounceLocalT < 0.7 && currentBounce < 2) {
        scaleX = 0.9
        scaleY = 1.12
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = groundY
      // Resting squash on ground with gentle breathing
      scaleX = 1.08 + Math.sin(holdProgress * Math.PI * 4) * 0.03
      scaleY = 0.92 + Math.sin(holdProgress * Math.PI * 4) * 0.02
    } else {
      // Exit: one big bounce off screen upward
      const exitArc = 1 - Math.pow(exitProgress, 2) // Parabolic exit
      translateY = groundY - exitProgress * dropHeight * 1.5
      scaleX = 0.85
      scaleY = 1.18
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: `translateX(-50%) translateY(${-translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'center bottom',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            textShadow: '4px 4px 0 rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Ground shadow */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.2)',
              filter: 'blur(3px)',
            }}
          />
        )}
      </div>
    )
  },
}

function BounceWordComponent(props: MotionGraphicProps<BounceWordConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bounce-word',
  title: 'Bounce Word',
  description:
    'Word bounces like a rubber ball with realistic physics. Multi-bounce entry with squash/stretch, rests on ground, bounces off on exit.',
  tags: ['kinetic', 'bounce', 'physics', 'rubber', 'ball', 'fun', 'playful'],
  category: 'captions',
  component: BounceWordComponent as any,
  defaultConfig: {
    words: ['BOING', 'BOUNCE', 'HOP', 'POP'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BOING', 'BOUNCE', 'HOP', 'POP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
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
