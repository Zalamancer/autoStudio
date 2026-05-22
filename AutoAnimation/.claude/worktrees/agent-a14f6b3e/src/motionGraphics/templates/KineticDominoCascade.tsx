import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DominoCascadeConfig extends KineticBaseConfig {}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    const chars = word.split('')
    const numChars = chars.length

    // Each character falls like a domino triggered by the previous
    // Cascade delay: each char triggers after the previous finishes its fall
    const cascadeWindow = 0.65 // fraction of enterProgress for the full cascade
    const charStagger = cascadeWindow / Math.max(numChars, 1)

    const charElements = chars.map((ch, ci) => {
      // Each char starts falling when the previous one has landed
      const charStart = ci * charStagger
      const charEnd = charStart + charStagger * 1.4 // overlap for chain feel
      const charProgress = Math.max(0, Math.min(1, (enterProgress - charStart) / (charEnd - charStart)))

      let charTranslateY = 0
      let charRotateX = 0
      let charOpacity = 0
      let charScaleX = 1
      let charScaleY = 1

      if (phase === 'enter') {
        if (charProgress <= 0) {
          // Not yet triggered — standing tall, invisible
          charOpacity = 0
          charTranslateY = -height * 0.3
          charRotateX = -90
        } else {
          // Domino falls forward: rotates from -90 (standing) to 0 (flat on ground)
          // Then bounces a little
          const bounced = easeOutBounce(charProgress)
          charRotateX = -90 + 90 * bounced
          charOpacity = Math.min(1, charProgress * 4)
          charTranslateY = 0

          // Squash on hitting ground
          if (charProgress > 0.7) {
            const squashT = (charProgress - 0.7) / 0.3
            charScaleX = 1 + Math.sin(squashT * Math.PI) * 0.3
            charScaleY = 1 - Math.sin(squashT * Math.PI) * 0.2
          }
        }
      } else if (phase === 'hold') {
        charOpacity = 1
        charRotateX = 0
        charScaleX = 1 + Math.exp(-holdProgress * 8) * 0.05
        charScaleY = 1 - Math.exp(-holdProgress * 8) * 0.03
        charTranslateY = 0
      } else {
        // Exit: reverse cascade — letters pop back up right-to-left
        const exitStart = (numChars - 1 - ci) * (0.6 / Math.max(numChars, 1))
        const charExitProgress = Math.max(0, Math.min(1, (exitProgress - exitStart) / 0.5))
        charOpacity = 1 - charExitProgress
        charTranslateY = -charExitProgress * height * 0.4
        charRotateX = charExitProgress * -45
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${charTranslateY}px) rotateX(${charRotateX}deg) scaleX(${charScaleX}) scaleY(${charScaleY})`,
            transformOrigin: 'center bottom',
            transformStyle: 'preserve-3d',
            opacity: charOpacity,
            color,
            textShadow: `2px 4px 0 rgba(0,0,0,0.6), 0 0 20px ${color}50`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          transformStyle: 'preserve-3d',
          perspective: 600,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(48px, 13vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {charElements}
      </div>
    )
  },
}

function DominoCascadeComponent(props: MotionGraphicProps<DominoCascadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-domino-cascade',
  title: 'Kinetic Domino Cascade',
  description:
    'Each letter falls like a domino triggered by the previous — chain reaction cascade entry with bounce squash. Reverse cascade on exit.',
  tags: ['kinetic', 'typography', 'domino', 'cascade', 'chain', 'physics', 'letters', '3d'],
  category: 'captions',
  component: DominoCascadeComponent as any,
  defaultConfig: {
    words: ['CHAIN', 'REACT', 'FALL', 'DOMINO'],
    colors: ['#FF6600', '#FFCC00', '#FF3399', '#00CCFF'],
    bgColor: '#100810',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CHAIN', 'REACT', 'FALL', 'DOMINO'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6600', '#FFCC00', '#FF3399', '#00CCFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
