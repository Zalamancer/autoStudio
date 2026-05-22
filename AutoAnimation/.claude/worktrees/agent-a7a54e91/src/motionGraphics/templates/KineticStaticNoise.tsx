import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StaticNoiseConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Simulated TV static using multiple gradient layers that shift per frame
    const seed = frame * 7
    const g1 = `rgba(${Math.floor(rand(seed) * 40)},${Math.floor(rand(seed + 1) * 40)},${Math.floor(rand(seed + 2) * 40)},0.4)`
    const g2 = `rgba(${Math.floor(rand(seed + 3) * 60)},${Math.floor(rand(seed + 4) * 60)},${Math.floor(rand(seed + 5) * 60)},0.3)`

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Static noise layer - rapidly changing gradients simulate noise */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                ${rand(seed + 6) * 180}deg,
                ${g1} 0px, transparent ${1 + rand(seed + 7) * 3}px,
                ${g2} ${2 + rand(seed + 8) * 4}px, transparent ${4 + rand(seed + 9) * 3}px
              )
            `,
            opacity: 0.8,
          }}
        />
        {/* Horizontal scan distortion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(frame * 5) % 100}%`,
            height: 3,
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        {/* VHS tracking line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(frame * 2 + 30) % 100}%`,
            height: 8,
            background: 'rgba(255,255,255,0.03)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const currentFrame = frame ?? 0
    let opacity = 0
    let blur = 0
    let translateX = 0

    if (phase === 'enter') {
      // Static intensifies then clears for text
      opacity = enterProgress > 0.5 ? Math.min(1, (enterProgress - 0.5) * 4) : 0
      blur = enterProgress < 0.6 ? (1 - enterProgress) * 8 : 0
      // VHS tracking wobble
      translateX = enterProgress < 0.7 ? (rand(currentFrame + index) - 0.5) * 20 * (1 - enterProgress) : 0
    } else if (phase === 'hold') {
      opacity = 1
      // Occasional static burst during hold
      const glitchSeed = index * 97 + currentFrame
      if (rand(glitchSeed) < 0.03) {
        opacity = 0.5
        translateX = (rand(glitchSeed + 1) - 0.5) * 10
      }
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 6
      translateX = exitProgress * (rand(index * 31) - 0.5) * 30
    }

    return (
      <>
        {/* Ghosted duplicate (VHS double image) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + 3}px), calc(-50% + 2px))`,
            opacity: opacity * 0.15,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#ffffff',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color,
            textShadow: `0 0 8px ${color}, 0 0 20px rgba(255,255,255,0.2)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function StaticNoiseComponent(props: MotionGraphicProps<StaticNoiseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-static-noise',
  title: 'Kinetic Static Noise',
  description: 'VHS/TV static noise background with text emerging through interference, tracking wobble and ghosted doubles',
  tags: ['kinetic', 'typography', 'horror', 'static', 'noise', 'vhs', 'dark', 'tv'],
  category: 'captions',
  component: StaticNoiseComponent as any,
  defaultConfig: {
    words: ['SIGNAL', 'LOST', 'STATIC', 'DEAD'],
    colors: ['#CCCCCC', '#AAAAAA', '#EEEEEE', '#888888'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIGNAL', 'LOST', 'STATIC', 'DEAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CCCCCC', '#AAAAAA', '#EEEEEE', '#888888'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
