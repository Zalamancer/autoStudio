import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RatioTextConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Screen shake during enter phases
    const t = (frame / fps) % 1
    const shakePhase = t < 0.2
    const shakeX = shakePhase ? Math.sin(t * 80) * 3 * (1 - t / 0.2) : 0
    const shakeY = shakePhase ? Math.cos(t * 60) * 2 * (1 - t / 0.2) : 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      />
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    let opacity = 1
    let scale = 0.1
    let blur = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      // Start tiny, grow to fill screen
      scale = 0.1 + eased * 1.4
      opacity = Math.min(1, enterProgress * 3)
      blur = (1 - eased) * 8
    } else if (phase === 'hold') {
      // Pulsing dominance energy
      scale = 1.5 + Math.sin(holdProgress * Math.PI * 6) * 0.08
      opacity = 1
      blur = 0
    } else {
      scale = 1.5 + exitProgress * 0.5
      opacity = 1 - exitProgress
      blur = exitProgress * 10
    }

    // Destructive energy lines during hold
    const showEnergy = phase === 'hold' || (phase === 'enter' && enterProgress > 0.7)
    const energyLines = showEnergy ? 4 : 0
    const frameNum = frame || 0

    return (
      <>
        {/* Energy lines radiating out */}
        {Array.from({ length: energyLines }).map((_, i) => {
          const angle = (i / energyLines) * 360 + (frameNum * 2)
          const lineLength = 20 + Math.sin(frameNum * 0.1 + i) * 10
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${lineLength}%`,
                height: '3px',
                background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                transformOrigin: 'center',
              }}
            />
          )
        })}

        {/* Shadow text for depth */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + 3px), calc(-50% + 3px)) scale(${scale})`,
            opacity: opacity * 0.3,
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(60px, 18vw, 240px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: '#000000',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            filter: `blur(${blur + 2}px)`,
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
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(60px, 18vw, 240px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            filter: `blur(${blur}px)`,
            textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function RatioTextComponent(props: MotionGraphicProps<RatioTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ratio-text',
  title: 'Ratio Text',
  description: 'Massive "RATIO" text that grows to fill the screen with destructive energy, pulsing dominance, and screen shake',
  tags: ['kinetic', 'meme', 'ratio', 'viral', 'twitter', 'destructive', 'massive'],
  category: 'captions',
  component: RatioTextComponent as any,
  defaultConfig: {
    words: ['RATIO', 'L', 'COPE', 'SEETHE'],
    colors: ['#FF0000', '#FF4400', '#FF0000', '#FF4400'],
    bgColor: '#0a0a0a',
    cycleDuration: 0.9,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RATIO', 'L', 'COPE', 'SEETHE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0000', '#FF4400'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.9, min: 0.3, max: 5, group: 'Timing' },
  ],
})
